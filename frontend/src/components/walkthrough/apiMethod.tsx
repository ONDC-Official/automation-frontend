import Steps from "./guideStep";
import CodeBlock from "./code";

export interface CodeSnippet {
  label: string;       // e.g. "Node.js", "Java"
  language: string;    // e.g. "typescript", "java"
  content: string;     // code block
}

export interface Step {
  title: string;       // e.g. "GET API"
  description: string; // explanation text
  code: CodeSnippet[]; // one or more code snippets per step
}

const steps: Step[] = [
  {
    title: "GET API",
    description: `“Ask for something” (e.g., Menu → GET /menu)`,
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

const ApiMethod = () => {
  return (
    <div className="flex flex-row flex-1 h-full">
      {/* Steps */}
      <div className="w-[60%] overflow-y-auto h-full px-4">
        <Steps steps={steps} />
      </div>

      {/* Code Snippets */}
      <div className="w-[40%] px-4 border-l overflow-y-auto h-full space-y-8">
        {steps.map((step, idx) => (
          <CodeBlock key={idx} step={step} />
        ))}
      </div>
    </div>
  );
};

export default ApiMethod;
