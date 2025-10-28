import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("💥 Dashboard render error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            textAlign: "center",
            marginTop: "20vh",
            color: "red",
            padding: "20px",
          }}
        >
          <h2>Something went wrong 🚨</h2>
          <p>{this.state.error?.message || "Please refresh and try again."}</p>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
