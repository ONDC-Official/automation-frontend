import { useContext, useEffect, useState } from "react";
import { UserContext } from "@context/userContext";
import { UserDetails } from "../types";

export const useUserDetails = () => {
    const [userDetails, setUserDetails] = useState<UserDetails | undefined>(undefined);
    const userContext = useContext(UserContext);
    const user = userContext.userDetails;

    useEffect(() => {
        setUserDetails(user);
    }, [user]);

    return userDetails;
};
