import React, { useEffect, useState } from "react";
import API from "../../utils/api";

export default function PatientTable() {
  const [patients, setPatients] = useState([]);

  useEffect(() => {
    API.get("/patients")
      .then((res) => setPatients(res.data))
      .catch(console.error);
  }, []);

  return (
    <table border="1" style={{ width: "100%", marginTop: "1rem" }}>
      <thead>
        <tr>
          <th>ID</th>
          <th>First Name</th>
          <th>Last Name</th>
          <th>Contact</th>
          <th>DOB</th>
        </tr>
      </thead>
      <tbody>
        {patients.map((p) => (
          <tr key={p.id}>
            <td>{p.id}</td>
            <td>{p.first_name}</td>
            <td>{p.last_name}</td>
            <td>{p.contact}</td>
            <td>{p.dob}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
