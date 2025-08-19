import React, { useState, useEffect } from 'react';
import TaskDashboard from './TaskDashboard.jsx';

/**
 * App - Main React application component for TaskManager
 * 
 * This component serves as the entry point for the TaskManager React application,
 * providing the main dashboard interface and handling global app state.
 * 
 * @returns {JSX.Element} App component
 */
const App = () => {
  const [apiConnected, setApiConnected] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check API connectivity on mount
  useEffect(() => {
    const checkApiHealth = async () => {
      try {
        const response = await fetch('/api/health');
        const data = await response.json();
        
        if (data.success) {
          setApiConnected(true);
          setApiError(null);
        } else {
          throw new Error('API health check failed');
        }
      } catch (error) {
        console.error('API connectivity check failed:', error);
        setApiConnected(false);
        setApiError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    checkApiHealth();
    
    // Check API health every 30 seconds
    const healthInterval = setInterval(checkApiHealth, 30000);
    
    return () => clearInterval(healthInterval);
  }, []);

  // Handle global errors from the dashboard
  const handleError = (error) => {
    console.error('Dashboard error:', error);
    setApiError(error.message);
    
    // If it's a connection error, mark API as disconnected
    if (error.message.includes('Failed to fetch') || error.message.includes('Network')) {
      setApiConnected(false);
    }
  };

  // Retry API connection
  const handleRetryConnection = async () => {
    setIsLoading(true);
    setApiError(null);
    
    try {
      const response = await fetch('/api/health');
      const data = await response.json();
      
      if (data.success) {
        setApiConnected(true);
        setApiError(null);
      } else {
        throw new Error('API health check failed');
      }
    } catch (error) {
      setApiConnected(false);
      setApiError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        backgroundColor: '#f9fafb'
      }}>
        <div style={{
          padding: '40px',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          textAlign: 'center',
          maxWidth: '400px'
        }}>
          <div style={{
            fontSize: '48px',
            marginBottom: '16px',
            animation: 'spin 2s linear infinite'
          }}>
            🔄
          </div>
          <h2 style={{
            margin: '0 0 8px 0',
            fontSize: '20px',
            fontWeight: '600',
            color: '#111827'
          }}>
            Loading TaskManager
          </h2>
          <p style={{
            margin: 0,
            fontSize: '14px',
            color: '#6b7280'
          }}>
            Connecting to API server...
          </p>
        </div>
        
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!apiConnected) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        backgroundColor: '#f9fafb',
        padding: '20px'
      }}>
        <div style={{
          padding: '40px',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          textAlign: 'center',
          maxWidth: '500px'
        }}>
          <div style={{
            fontSize: '64px',
            marginBottom: '20px'
          }}>
            ⚠️
          </div>
          
          <h2 style={{
            margin: '0 0 12px 0',
            fontSize: '24px',
            fontWeight: '600',
            color: '#dc2626'
          }}>
            API Connection Failed
          </h2>
          
          <p style={{
            margin: '0 0 20px 0',
            fontSize: '16px',
            color: '#6b7280',
            lineHeight: '1.5'
          }}>
            Unable to connect to the TaskManager API server. Please ensure the server is running.
          </p>
          
          {apiError && (
            <div style={{
              backgroundColor: '#fee2e2',
              border: '1px solid #fecaca',
              borderRadius: '6px',
              padding: '12px',
              marginBottom: '20px',
              fontSize: '14px',
              color: '#dc2626',
              textAlign: 'left'
            }}>
              <strong>Error Details:</strong> {apiError}
            </div>
          )}
          
          <div style={{
            marginBottom: '20px',
            padding: '16px',
            backgroundColor: '#f3f4f6',
            borderRadius: '6px',
            textAlign: 'left',
            fontSize: '14px',
            color: '#374151'
          }}>
            <strong>To start the API server:</strong>
            <pre style={{
              margin: '8px 0 0 0',
              padding: '8px',
              backgroundColor: '#1f2937',
              color: '#f9fafb',
              borderRadius: '4px',
              fontSize: '12px',
              fontFamily: 'monospace'
            }}>
              npm start
            </pre>
            <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#6b7280' }}>
              The server should be accessible at http://localhost:3000
            </p>
          </div>
          
          <button
            onClick={handleRetryConnection}
            style={{
              padding: '12px 24px',
              backgroundColor: '#3b82f6',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'background-color 0.2s ease'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#2563eb'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#3b82f6'}
          >
            🔄 Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f9fafb',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Global error notification */}
      {apiError && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          backgroundColor: '#fee2e2',
          border: '1px solid #fecaca',
          borderRadius: '6px',
          padding: '12px 16px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          zIndex: 2000,
          maxWidth: '400px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{
              fontSize: '14px',
              color: '#dc2626',
              fontWeight: '500'
            }}>
              ⚠️ {apiError}
            </div>
            <button
              onClick={() => setApiError(null)}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                color: '#dc2626',
                cursor: 'pointer',
                padding: '4px',
                marginLeft: '8px'
              }}
            >
              ✕
            </button>
          </div>
        </div>
      )}
      
      {/* Main Dashboard */}
      <TaskDashboard
        apiBaseUrl="/api"
        refreshInterval={30000} // 30 seconds
        onError={handleError}
      />
      
      {/* Footer */}
      <footer style={{
        textAlign: 'center',
        padding: '20px',
        marginTop: '40px',
        fontSize: '14px',
        color: '#6b7280',
        borderTop: '1px solid #e5e7eb',
        backgroundColor: '#ffffff'
      }}>
        <div>
          TaskManager Dashboard - Built with React & TaskManager API
        </div>
        <div style={{ marginTop: '4px', fontSize: '12px' }}>
          🤖 Enhanced frontend for infinite continue hook system
        </div>
      </footer>
    </div>
  );
};

export default App;