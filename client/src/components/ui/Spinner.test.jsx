function Spinner() {
  return (
    <div
      role="presentation"
      style={{
        display: "inline-block",
        width: "32px",
        height: "32px",
        border: "4px solid #e2e8f0",
        borderTopColor: "#0058a3",
        borderRadius: "50%",
        animation: "spin 0.8s linear infinite",
      }}
    />
  );
}

export default Spinner;
