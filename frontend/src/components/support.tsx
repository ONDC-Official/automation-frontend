const Support = () => {
  const sessionIdForSupport = JSON.parse(
    localStorage.getItem("sessionIdForSupport") as string
  );
  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-lg font-semibold text-gray-800">Instruction</h1>
      <div className="">
        <p className="text-sm text-gray-600">
          For further technical assistance, dedicated technical support team is
          reachable at the email ID: &nbsp;
          <a
            href={`mailto:techsupport@ondc.org`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 underline hover:text-blue-700"
          >
            techsupport@ondc.org
          </a>
        </p>
        <p className="text-sm text-gray-600">
          On raising any issue's or support ask please prefix your email subject
          with "[Workbench]"
        </p>
      </div>

      {sessionIdForSupport && (
        <div>
          <p className="text-sm text-gray-600">{`Mention below session Id in the email for reference and quick resolution:`}</p>
          <div className="flex flex-col">
            {/* <p className="text-sm text-gray-600">
              Unit Session: <b>{sessionIdForSupport?.unitSession || "-"}</b>
            </p> */}
            <p className="text-sm text-gray-600">
              Scenario Session:{" "}
              <b>{sessionIdForSupport?.scenarioSession || "-"}</b>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Support;
