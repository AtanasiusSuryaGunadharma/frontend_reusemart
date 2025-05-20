import React, { Component } from "react";

class ErrorBoundary extends Component {
  state = { hasError: false, error: null, errorInfo: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div>
          <h2>Terjadi kesalahan.</h2>
          <p>Maaf, ada masalah dalam memuat dashboard. Silakan coba lagi atau hubungi dukungan.</p>
          <button onClick={() => window.location.reload()}>Muat Ulang</button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;