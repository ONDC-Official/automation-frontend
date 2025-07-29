import React, { useState } from "react";
import { toast } from "react-toastify";
import { Button, Card, Tabs, Typography } from "antd";
import {
  CopyOutlined,
  DownloadOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;
const { TabPane } = Tabs;

interface OnboardingSuccessPayloadProps {
  submittedData: any;
  onSearchPayload: any;
  onBack: () => void;
}

const OnboardingSuccessPayload: React.FC<OnboardingSuccessPayloadProps> = ({
  submittedData,
  onSearchPayload,
  onBack,
}) => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const handleCopy = async (text: string, section: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSection(section);
      toast.success(`${section} copied to clipboard!`);
      setTimeout(() => setCopiedSection(null), 3000);
    } catch (err) {
      toast.error("Failed to copy to clipboard");
    }
  };

  const handleDownload = (data: any, filename: string) => {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`${filename} downloaded!`);
  };

  const formatJson = (data: any) => {
    return JSON.stringify(data, null, 2);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <CheckCircleOutlined className="text-6xl text-green-500" />
          </div>
          <Title level={2} className="mb-2">
            Seller Onboarding Successful!
          </Title>
          <Text className="text-gray-600">
            Your seller profile has been created successfully. Below you can
            view and copy the generated payloads.
          </Text>
        </div>

        <Card className="shadow-lg">
          <Tabs defaultActiveKey="1" size="large">
            <TabPane tab="On Search Payload" key="1">
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <Title level={4} className="mb-0">
                    on_search Payload
                  </Title>
                  <div className="space-x-2">
                    <Button
                      icon={<CopyOutlined />}
                      onClick={() =>
                        handleCopy(
                          formatJson(onSearchPayload),
                          "On Search Payload"
                        )
                      }
                    >
                      {copiedSection === "On Search Payload"
                        ? "Copied!"
                        : "Copy"}
                    </Button>
                    <Button
                      icon={<DownloadOutlined />}
                      onClick={() =>
                        handleDownload(
                          onSearchPayload,
                          "on_search_payload.json"
                        )
                      }
                    >
                      Download
                    </Button>
                  </div>
                </div>

                <div className="bg-gray-900 rounded-lg p-4 overflow-auto max-h-96">
                  <pre className="text-green-400 text-sm font-mono whitespace-pre">
                    {formatJson(onSearchPayload)}
                  </pre>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> This payload is formatted according
                    to ONDC specifications and can be used for integration with
                    ONDC network.
                  </p>
                </div>
              </div>
            </TabPane>

            <TabPane tab="Submitted Data" key="2">
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <Title level={4} className="mb-0">
                    Original Submitted Data
                  </Title>
                  <div className="space-x-2">
                    <Button
                      icon={<CopyOutlined />}
                      onClick={() =>
                        handleCopy(formatJson(submittedData), "Submitted Data")
                      }
                    >
                      {copiedSection === "Submitted Data" ? "Copied!" : "Copy"}
                    </Button>
                    <Button
                      icon={<DownloadOutlined />}
                      onClick={() =>
                        handleDownload(submittedData, "submitted_data.json")
                      }
                    >
                      Download
                    </Button>
                  </div>
                </div>

                <div className="bg-gray-900 rounded-lg p-4 overflow-auto max-h-96">
                  <pre className="text-green-400 text-sm font-mono whitespace-pre">
                    {formatJson(submittedData)}
                  </pre>
                </div>
              </div>
            </TabPane>

          </Tabs>
        </Card>

        <div className="mt-8 text-center space-x-4">
          <Button size="large" onClick={onBack}>
            Back to Dashboard
          </Button>
          <Button type="primary" size="large" onClick={() => window.print()}>
            Print Details
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingSuccessPayload;
