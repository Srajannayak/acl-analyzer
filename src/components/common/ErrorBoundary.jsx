import React from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Report Error Boundary caught:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleDashboard = () => {
    window.location.href = "/dashboard";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "70vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "40px 20px",
            fontFamily: "Inter, sans-serif",
            background: "#F8FAFC",
          }}
        >
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: "20px",
              padding: "48px 36px",
              maxWidth: "560px",
              width: "100%",
              textAlign: "center",
              border: "1px solid #E2E8F0",
              boxShadow: "0 20px 40px -15px rgba(15, 23, 42, 0.08)",
            }}
          >
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                background: "#FEE2E2",
                color: "#DC2626",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px",
              }}
            >
              <AlertTriangle size={32} />
            </div>

            <h1
              style={{
                fontSize: "24px",
                fontWeight: 800,
                color: "#0F172A",
                marginBottom: "12px",
              }}
            >
              Report encountered an error.
            </h1>

            <p
              style={{
                color: "#64748B",
                fontSize: "15px",
                lineHeight: "1.6",
                marginBottom: "24px",
              }}
            >
              An unexpected error occurred while rendering the clinical analysis report.
              The error details have been logged to the developer console.
            </p>

            {this.state.error && (
              <div
                style={{
                  background: "#F1F5F9",
                  padding: "12px 16px",
                  borderRadius: "10px",
                  fontSize: "13px",
                  color: "#334155",
                  fontFamily: "monospace",
                  textAlign: "left",
                  overflowX: "auto",
                  marginBottom: "28px",
                  border: "1px solid #CBD5E1",
                }}
              >
                {this.state.error.toString()}
              </div>
            )}

            <div
              style={{
                display: "flex",
                gap: "12px",
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
              <button
                onClick={this.handleReload}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "#2563EB",
                  color: "#FFFFFF",
                  border: "none",
                  padding: "12px 24px",
                  borderRadius: "12px",
                  fontWeight: 600,
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              >
                <RefreshCw size={16} />
                Reload Page
              </button>

              <button
                onClick={this.handleDashboard}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "#EEF2F6",
                  color: "#1E293B",
                  border: "1px solid #CBD5E1",
                  padding: "12px 24px",
                  borderRadius: "12px",
                  fontWeight: 600,
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              >
                <Home size={16} />
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
