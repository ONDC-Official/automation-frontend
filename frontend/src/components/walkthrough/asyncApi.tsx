import Steps from "./guideStep";
import { Step } from "./apiMethod";

const steps: Step[] = [
  {
    title: "GET API",
    description: `
    <b>Synchronous (Sync)</b>: Like asking the waiter for water → you get it immediately.
    <b>Asynchronous (Async)</b>: Like ordering a pizza → waiter confirms, but pizza arrives later.`,
    code: [
      {
        label: "Node.js",
        language: "typescript",
        content: `
import axios from "axios";

const BASE_URL = "http://localhost:3000";

const getMenu = async () => {
  try {
    const response = await axios.get(\`\${BASE_URL}/menu\`);
    console.log("Menu:", response.data);
  } catch (e) {
    console.error("Error fetching menu:", e);
  }
};

getMenu();
        `,
      },
      {
        label: "Java",
        language: "java",
        content: `
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.URI;

public class GetMenu {
    public static void main(String[] args) throws Exception {
        HttpClient client = HttpClient.newHttpClient();
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create("http://localhost:3000/menu"))
            .GET()
            .build();

        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
        System.out.println("Menu: " + response.body());
    }
}
        `,
      },
    ],
  },
  {
    title: "POST API ",
    description: `
    <b>Synchronous (Sync)</b>: Like asking the waiter for water → you get it immediately.
    <b>Asynchronous (Async)</b>: Like ordering a pizza → waiter confirms, but pizza arrives later.`,
    code: [
      {
        label: "Node.js",
        language: "typescript",
        content: `
import axios from "axios";

const BASE_URL = "http://localhost:3000";

const getMenu = async () => {
  try {
    const response = await axios.get(\`\${BASE_URL}/menu\`);
    console.log("Menu:", response.data);
  } catch (e) {
    console.error("Error fetching menu:", e);
  }
};

getMenu();
        `,
      },
      {
        label: "Java",
        language: "java",
        content: `
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.URI;

public class GetMenu {
    public static void main(String[] args) throws Exception {
        HttpClient client = HttpClient.newHttpClient();
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create("http://localhost:3000/menu"))
            .GET()
            .build();

        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
        System.out.println("Menu: " + response.body());
    }
}
        `,
      },
    ],
  },
  {
    title: "POST API ",
    description: `“Place an order” (e.g., Order pizza → POST /order)`,
    code: [
      {
        label: "Node.js",
        language: "typescript",
        content: `
import axios from "axios";

const BASE_URL = "http://localhost:3000";

const getMenu = async () => {
  try {
    const response = await axios.get(\`\${BASE_URL}/menu\`);
    console.log("Menu:", response.data);
  } catch (e) {
    console.error("Error fetching menu:", e);
  }
};

getMenu();
        `,
      },
      {
        label: "Java",
        language: "java",
        content: `
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.URI;

public class GetMenu {
    public static void main(String[] args) throws Exception {
        HttpClient client = HttpClient.newHttpClient();
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create("http://localhost:3000/menu"))
            .GET()
            .build();

        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
        System.out.println("Menu: " + response.body());
    }
}
        `,
      },
    ],
  },
];

const AsyncApi = () => {
  return (
    <div className="w-full mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-6">Sync vs Async APIs</h1>

      <Steps steps={steps} />
    </div>
  );
};

export default AsyncApi;
