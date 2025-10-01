import React from "react";
import axios from "axios";

const Apitesting = () => {
    const [data, setData] = React.useState(null);
  const fetchData = async () => {
    try {
      const response = await axios.get("https://api.nationalize.io/?name=nathaniel");
      setData(response.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  return (
    <div>
      <h1>API Testing Component</h1>
      <button onClick={fetchData}>Fetch Data</button>
      <pre id="response">{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
};

export default Apitesting;
