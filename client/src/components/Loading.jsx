import React from "react";

const Loading = () => {
    const loaderStyle = {
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(255, 255, 255, 0.9)", // optional slight overlay
        zIndex: 9999, // make sure it's on top
    };

    const spinnerStyle = {
        width: "60px", // smaller circle
        height: "60px",
        border: "6px solid #ccc",
        borderTop: "6px solid #1D4ED8", // blue color
        borderRadius: "50%",
        animation: "spin 1s linear infinite",
    };

    return (
        <div style={loaderStyle}>
            <div style={spinnerStyle}></div>
            <div style={{ marginTop: "12px", fontSize: "1em", color: "#1D4ED8" }}>
                Loading...
            </div>

            <style>
                {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
            </style>
        </div>
    );
};

export default Loading;
