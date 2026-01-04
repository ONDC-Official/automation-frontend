import axios from "axios";
import { toast } from "react-toastify";

export async function getGithubAvatarUrl(userName: string) {
  try {
    if (!userName) {
      throw new Error("GitHub username is required");
    }

    const response = await fetch(`https://api.github.com/users/${userName}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch GitHub user: ${response.status}`);
    }

    const data = await response.json();
    return data.avatar_url as string; // This is the image URL
  } catch (error) {
    console.error("Error fetching GitHub avatar:", error);
    return undefined; // Return undefined if there's an error
  }
}

export async function generateKeys() {
  try {
    const url = `${import.meta.env.VITE_BACKEND_URL}/auth/api/generate-keys`;
    const response = await axios.get(url, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error("Error generating keys:", error);
    toast.error("Failed to generate keys!");
    throw new Error("Failed to generate keys");
  }
}
