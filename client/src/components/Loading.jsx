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
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        zIndex: 9999,
        backdropFilter: "blur(2px)",
    };

    const spinnerContainerStyle = {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "20px",
    };

    const spinnerStyle = {
        width: "80px",
        height: "80px",
        border: "8px solid #e0e7ff",
        borderTop: "8px solid #1D4ED8",
        borderRadius: "50%",
        animation: "spinSmooth 1.2s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite",
        boxShadow: "0 0 20px rgba(29, 78, 216, 0.2)",
    };

    const loadingTextStyle = {
        fontSize: "1.2em",
        color: "#1D4ED8",
        fontWeight: "600",
        letterSpacing: "1px",
        marginTop: "10px",
        animation: "fadeInOut 1.5s ease-in-out infinite",
    };

    const dotStyle = {
        display: "inline-block",
        animation: "blink 1.4s infinite",
    };

    return (
        <div style={loaderStyle}>
            <div style={spinnerContainerStyle}>
                <div style={spinnerStyle}></div>
                <div style={loadingTextStyle}>
                    Loading<span style={{ ...dotStyle, animationDelay: "0s" }}>.</span>
                    <span style={{ ...dotStyle, animationDelay: "0.2s" }}>.</span>
                    <span style={{ ...dotStyle, animationDelay: "0.4s" }}>.</span>
                </div>
            </div>

            <style>
                {`
          @keyframes spinSmooth {
            0% { 
              transform: rotate(0deg);
              box-shadow: 0 0 20px rgba(29, 78, 216, 0.2);
            }
            50% {
              box-shadow: 0 0 30px rgba(29, 78, 216, 0.4);
            }
            100% { 
              transform: rotate(360deg);
              box-shadow: 0 0 20px rgba(29, 78, 216, 0.2);
            }
          }

          @keyframes fadeInOut {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
          }

          @keyframes blink {
            0%, 20%, 50%, 80%, 100% { opacity: 1; }
            40% { opacity: 0.3; }
            60% { opacity: 0.3; }
          }
        `}
            </style>
        </div>
    );
};

export default Loading;
