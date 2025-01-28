const Support = () => {
  const sessionIdForSupport = localStorage.getItem("sessionIdForSupport");

  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-lg font-semibold text-gray-800">Instruction</h1>
      <div className="">
        <p className="text-sm text-gray-600">
          For further technical assistance, dedicated technical support team is
          reachable at the email ID: &nbsp;
          <a
            href={`mailto:tectsupport@ondc.org`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 underline hover:text-blue-700"
          >
            automation-framework@ondc.org
          </a>
        </p>
      </div>

      {sessionIdForSupport && (
        <div>
          <p className="text-sm text-gray-600">{`Mention below session Id in the email for reference and quick resolution:`}</p>
          <p className="text-sm text-gray-600">
            <b>{sessionIdForSupport}</b>
          </p>
        </div>
      )}
    </div>
  );
};

export default Support;
