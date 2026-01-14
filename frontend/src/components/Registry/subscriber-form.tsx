import { useState, useEffect, useContext, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";

import type { Key, Mapping } from "@components/Registry/registry-types";
import * as api from "@utils/registry-apis";
import { KeysSection } from "@components/Registry/key-section";
import { MappingsSection } from "@components/Registry/mappingSections";
import { UserContext } from "@context/userContext";

const SubscriberForm = () => {
  const [isLoading, setIsLoading] = useState(true);
  const user = useContext(UserContext);
  const [formData, setFormData] = [user.subscriberData, user.setSubscriberData];

  const fetchUserLookup = useCallback(async () => {
    try {
      const data = await api.getSubscriberDetails(user.userDetails);
      if (data) {
        setFormData(data);
      }
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching subscriber details:", error);
      setIsLoading(false);
    }
  }, [user.userDetails, setFormData]);

  useEffect(() => {
    fetchUserLookup();
  }, [fetchUserLookup]);

  const addKey = async (key: Key): Promise<void> => {
    try {
      const data = {
        keys: [...formData.keys, key],
      };
      await api.patch(data, user.userDetails);
      setFormData((prev) => ({ ...prev, keys: [...prev.keys, key] }));
    } catch (error) {
      console.error("Error adding key:", error);
    }
  };

  const deleteKey = async (uk_id: string): Promise<void> => {
    try {
      const data = {
        keys: formData.keys.filter((k) => k.uk_id !== uk_id),
      };
      await api.delSubscriberDetails(data, user.userDetails);
      setFormData((prev) => ({
        ...prev,
        keys: prev.keys.filter((k) => k.uk_id !== uk_id),
      }));
    } catch (error) {
      console.error("Error deleting key:", error);
    }
  };

  const addMapping = async (mapping: Mapping): Promise<void> => {
    try {
      const uriId = uuidv4();
      const locationId = uuidv4();
      const convertedMapping = {
        uris: [
          {
            id: uriId,
            uri: mapping.uri,
          },
        ],
        locations: [
          {
            id: locationId,
            city: mapping.location_city,
            country: [mapping.location_country],
          },
        ],
        mappings: [
          {
            id: uuidv4(),
            domain: mapping.domain,
            type: mapping.type,
            uri_id: uriId,
            location_id: locationId,
          },
        ],
      };
      await api.patch(convertedMapping, user.userDetails);
      setFormData((prev) => ({
        ...prev,
        mappings: [...prev.mappings, mapping],
      }));
    } catch (error) {
      console.error("Error adding mapping:", error);
    }
  };

  const updateMapping = async (id: string, data: Partial<Mapping>): Promise<void> => {
    setFormData((prev) => ({
      ...prev,
      mappings: prev.mappings.map((m) => (m.id === id ? { ...m, ...data } : m)),
    }));
  };

  const deleteMapping = async (id: string): Promise<void> => {
    try {
      const data = {
        mappings: formData.mappings.filter((m) => m.id === id),
      };

      await api.delSubscriberDetails(data, user.userDetails);
      setFormData((prev) => ({
        ...prev,
        mappings: prev.mappings.filter((m) => m.id !== id),
      }));
    } catch (error) {
      console.error("Error deleting mapping:", error);
    }
  };

  if (isLoading) {
    return <div className="text-center p-10">Loading configuration...</div>;
  }

  return (
    <div className="bg-gray-100 min-h-screen relative">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 pb-24">
        <div className="space-y-8">
          <h1 className="text-3xl font-bold text-gray-900">Registry Configuration</h1>

          <KeysSection keys={formData.keys} onAddKey={addKey} onDeleteKey={deleteKey} />
          <MappingsSection
            mappings={formData.mappings}
            onAddMapping={addMapping}
            onUpdateMapping={updateMapping}
            onDeleteMapping={deleteMapping}
          />
        </div>
      </div>
    </div>
  );
};

export default SubscriberForm;
