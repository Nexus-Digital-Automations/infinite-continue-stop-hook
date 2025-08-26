import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import TaskList from './TaskList.jsx';
import TaskForm from './TaskForm.jsx';

/**
 * TaskDashboard - A comprehensive React dashboard for task management
 * 
 * This component provides a complete task management interface with real-time
 * updates, agent management, analytics, and integration with the TaskManager API.
 * 
 * @param {Object} props - Component properties
 * @param {string} props.apiBaseUrl - Base URL for the TaskManager API
 * @param {number} props.refreshInterval - Auto-refresh interval in milliseconds
 * @param {Function} props.onError - Error handler callback
 * @returns {JSX.Element} TaskDashboard component
 */
const TaskDashboard = ({ 
  apiBaseUrl = '/api', 
  refreshInterval = 30000,
  onError = null 
}) => {
  const [tasks, setTasks] = useState([]);
  const [agents, setAgents] = useState({});
  const [systemStats, setSystemStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [currentView, setCurrentView] = useState('dashboard'); // dashboard, tasks, agents, analytics
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // API helper functions
  const apiCall = useCallback(async (endpoint, options = {}) => {
    try {
      const response = await fetch(`${apiBaseUrl}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'API request failed');
      }

      return data.data;
    } catch (err) {
      console.error('API call failed:', err);
      if (onError) {
        onError(err);
      }
      setError(err.message);
      throw err;
    }
  }, [apiBaseUrl, onError]);

  // Fetch all dashboard data
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch tasks, agents, and system status in parallel
      const [tasksResponse, agentsResponse, statusResponse] = await Promise.all([
        apiCall('/tasks'),
        apiCall('/agents'),
        apiCall('/status')
      ]);

      setTasks(tasksResponse.tasks || []);
      setAgents(agentsResponse.agents || {});
      setSystemStats(statusResponse);
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  // Auto-refresh data
  useEffect(() => {
    fetchDashboardData();
    
    const interval = setInterval(fetchDashboardData, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchDashboardData, refreshInterval]);

  // Handle task creation
  const handleTaskCreate = async (taskData) => {
    try {
      await apiCall('/tasks', {
        method: 'POST',
        body: JSON.stringify(taskData)
      });
      
      setShowTaskForm(false);
      await fetchDashboardData(); // Refresh data after creation
    } catch (err) {
      console.error('Failed to create task:', err);
    }
  };

  // Handle task status update
  const handleTaskUpdate = async (taskId, updates) => {
    try {
      if (updates.status) {
        await apiCall(`/tasks/${taskId}/status`, {
          method: 'PUT',
          body: JSON.stringify(updates)
        });
      }
      
      await fetchDashboardData(); // Refresh data after update
    } catch (err) {
      console.error('Failed to update task:', err);
    }
  };

  // Handle task selection
  const handleTaskSelect = (task) => {
    setSelectedTask(task);
  };

  // Get enhanced analytics
  const getAnalytics = () => {
    const now = new Date();
    const today = now.toDateString();
    const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const analytics = {
      tasksByCategory: {},
      tasksByPriority: {},
      completionTrends: {
        today: 0,
        thisWeek: 0,
        avgPerDay: 0
      },
      agentStats: {
        total: Object.keys(agents).length,
        active: Object.values(agents).filter(agent => agent.isActive).length,
        workload: {}
      },
      systemHealth: {
        tasksPerAgent: tasks.length / Math.max(Object.keys(agents).length, 1),
        backlogSize: tasks.filter(t => t.status === 'pending').length,
        blockedTasks: tasks.filter(t => t.status === 'blocked').length
      }
    };

    // Calculate task distribution by category and priority
    tasks.forEach(task => {
      analytics.tasksByCategory[task.category] = (analytics.tasksByCategory[task.category] || 0) + 1;
      analytics.tasksByPriority[task.priority] = (analytics.tasksByPriority[task.priority] || 0) + 1;
      
      // Count completed tasks for trends
      if (task.status === 'completed' && task.completed_at) {
        const completedDate = new Date(task.completed_at);
        if (completedDate.toDateString() === today) {
          analytics.completionTrends.today++;
        }
        if (completedDate >= thisWeek) {
          analytics.completionTrends.thisWeek++;
        }
      }
    });

    analytics.completionTrends.avgPerDay = analytics.completionTrends.thisWeek / 7;

    return analytics;
  };

  const analytics = getAnalytics();

  // Render different views
  const renderDashboardView = () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
      {/* System Overview */}
      <div style={{
        backgroundColor: '#ffffff',
        padding: '20px',
        borderRadius: '8px',
        border: '1px solid #e5e7eb',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
      }}>
        <h3 style={{ margin: '0 0 16px 0', color: '#111827', fontSize: '18px', fontWeight: '600' }}>
          📊 System Overview
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
          <div style={{ textAlign: 'center', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '6px' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#374151' }}>{tasks.length}</div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>Total Tasks</div>
          </div>
          <div style={{ textAlign: 'center', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '6px' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#16a34a' }}>{analytics.agentStats.active}</div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>Active Agents</div>
          </div>
          <div style={{ textAlign: 'center', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '6px' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>{analytics.completionTrends.today}</div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>Completed Today</div>
          </div>
          <div style={{ textAlign: 'center', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '6px' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f59e0b' }}>{analytics.systemHealth.backlogSize}</div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>Pending Tasks</div>
          </div>
        </div>
      </div>

      {/* Task Categories */}
      <div style={{
        backgroundColor: '#ffffff',
        padding: '20px',
        borderRadius: '8px',
        border: '1px solid #e5e7eb',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
      }}>
        <h3 style={{ margin: '0 0 16px 0', color: '#111827', fontSize: '18px', fontWeight: '600' }}>
          🏷️ Task Categories
        </h3>
        <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
          {Object.entries(analytics.tasksByCategory)
            .sort(([,a], [,b]) => b - a)
            .map(([category, count]) => (
              <div key={category} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 0',
                borderBottom: '1px solid #f3f4f6'
              }}>
                <span style={{ fontSize: '14px', color: '#374151' }}>{category}</span>
                <span style={{
                  backgroundColor: '#16a34a',
                  color: '#ffffff',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: '500'
                }}>
                  {count}
                </span>
              </div>
            ))}
        </div>
      </div>

      {/* Active Agents */}
      <div style={{
        backgroundColor: '#ffffff',
        padding: '20px',
        borderRadius: '8px',
        border: '1px solid #e5e7eb',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
      }}>
        <h3 style={{ margin: '0 0 16px 0', color: '#111827', fontSize: '18px', fontWeight: '600' }}>
          🤖 Active Agents
        </h3>
        <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
          {Object.entries(agents).map(([agentId, agentData]) => (
            <div key={agentId} style={{
              padding: '8px 0',
              borderBottom: '1px solid #f3f4f6',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                  {agentId.split('_').slice(0, 2).join('_')}
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>
                  {agentData.role || 'development'}
                </div>
              </div>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: agentData.isActive ? '#10b981' : '#ef4444'
              }} />
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div style={{
        backgroundColor: '#ffffff',
        padding: '20px',
        borderRadius: '8px',
        border: '1px solid #e5e7eb',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
      }}>
        <h3 style={{ margin: '0 0 16px 0', color: '#111827', fontSize: '18px', fontWeight: '600' }}>
          📈 Performance Metrics
        </h3>
        <div style={{ fontSize: '14px', color: '#374151', lineHeight: '1.6' }}>
          <div style={{ marginBottom: '8px' }}>
            <strong>Tasks per Agent:</strong> {analytics.systemHealth.tasksPerAgent.toFixed(1)}
          </div>
          <div style={{ marginBottom: '8px' }}>
            <strong>Completion Rate:</strong> {analytics.completionTrends.avgPerDay.toFixed(1)} tasks/day
          </div>
          <div style={{ marginBottom: '8px' }}>
            <strong>Blocked Tasks:</strong> {analytics.systemHealth.blockedTasks}
          </div>
          <div>
            <strong>Last Refresh:</strong> {lastRefresh.toLocaleTimeString()}
          </div>
        </div>
      </div>
    </div>
  );

  const renderTasksView = () => (
    <TaskList
      tasks={tasks}
      onTaskUpdate={handleTaskUpdate}
      onTaskSelect={handleTaskSelect}
    />
  );

  const renderAgentsView = () => (
    <div style={{
      backgroundColor: '#ffffff',
      padding: '20px',
      borderRadius: '8px',
      border: '1px solid #e5e7eb'
    }}>
      <h2 style={{ margin: '0 0 20px 0', color: '#111827' }}>Agent Management</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
        {Object.entries(agents).map(([agentId, agentData]) => (
          <div key={agentId} style={{
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            padding: '16px',
            backgroundColor: '#f9fafb'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>{agentId}</h3>
              <div style={{
                padding: '4px 8px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: '500',
                backgroundColor: agentData.isActive ? '#dcfce7' : '#fee2e2',
                color: agentData.isActive ? '#166534' : '#dc2626'
              }}>
                {agentData.isActive ? 'Active' : 'Inactive'}
              </div>
            </div>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>
              <div><strong>Role:</strong> {agentData.role || 'development'}</div>
              <div><strong>Tasks:</strong> {tasks.filter(t => t.assigned_agent === agentId).length}</div>
              <div><strong>Last Seen:</strong> {agentData.lastHeartbeat ? 
                new Date(agentData.lastHeartbeat).toLocaleString() : 'Never'}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '400px',
        fontSize: '18px',
        color: '#6b7280'
      }}>
        <div>Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div style={{
      fontFamily: 'system-ui, -apple-system, sans-serif',
      maxWidth: '1400px',
      margin: '0 auto',
      padding: '20px'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        padding: '20px',
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        border: '1px solid #e5e7eb',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
      }}>
        <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '700', color: '#111827' }}>
          🎯 TaskManager Dashboard
        </h1>
        
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button
            onClick={() => fetchDashboardData()}
            style={{
              padding: '8px 16px',
              backgroundColor: '#f3f4f6',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              color: '#374151'
            }}
          >
            🔄 Refresh
          </button>
          
          <button
            onClick={() => setShowTaskForm(true)}
            style={{
              padding: '8px 16px',
              backgroundColor: '#16a34a',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            ➕ New Task
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div style={{
        marginBottom: '20px',
        padding: '4px',
        backgroundColor: '#f9fafb',
        borderRadius: '8px',
        border: '1px solid #e5e7eb',
        display: 'flex',
        gap: '4px'
      }}>
        {[
          { key: 'dashboard', label: '📊 Dashboard' },
          { key: 'tasks', label: '📋 Tasks' },
          { key: 'agents', label: '🤖 Agents' }
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setCurrentView(key)}
            style={{
              padding: '8px 16px',
              backgroundColor: currentView === key ? '#16a34a' : 'transparent',
              color: currentView === key ? '#ffffff' : '#374151',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.2s ease'
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Error Display */}
      {error && (
        <div style={{
          backgroundColor: '#fee2e2',
          border: '1px solid #fecaca',
          borderRadius: '6px',
          padding: '12px',
          marginBottom: '20px',
          color: '#dc2626'
        }}>
          ⚠️ Error: {error}
        </div>
      )}

      {/* Main Content */}
      <div>
        {currentView === 'dashboard' && renderDashboardView()}
        {currentView === 'tasks' && renderTasksView()}
        {currentView === 'agents' && renderAgentsView()}
      </div>

      {/* Task Form Modal */}
      {showTaskForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflow: 'auto',
            margin: '20px'
          }}>
            <TaskForm
              onTaskCreate={handleTaskCreate}
              onCancel={() => setShowTaskForm(false)}
            />
          </div>
        </div>
      )}

      {/* Task Detail Modal */}
      {selectedTask && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            padding: '24px',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflow: 'auto',
            margin: '20px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>Task Details</h2>
              <button
                onClick={() => setSelectedTask(null)}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                ✕
              </button>
            </div>
            <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
              <div style={{ marginBottom: '12px' }}>
                <strong>Title:</strong> {selectedTask.title}
              </div>
              <div style={{ marginBottom: '12px' }}>
                <strong>Description:</strong> {selectedTask.description || 'No description'}
              </div>
              <div style={{ marginBottom: '12px' }}>
                <strong>Status:</strong> {selectedTask.status}
              </div>
              <div style={{ marginBottom: '12px' }}>
                <strong>Category:</strong> {selectedTask.category}
              </div>
              <div style={{ marginBottom: '12px' }}>
                <strong>Priority:</strong> {selectedTask.priority}
              </div>
              <div style={{ marginBottom: '12px' }}>
                <strong>Assigned Agent:</strong> {selectedTask.assigned_agent || 'Unassigned'}
              </div>
              <div>
                <strong>Created:</strong> {selectedTask.created_at ? 
                  new Date(selectedTask.created_at).toLocaleString() : 'Unknown'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

TaskDashboard.propTypes = {
  apiBaseUrl: PropTypes.string,
  refreshInterval: PropTypes.number,
  onError: PropTypes.func
};

export default TaskDashboard;