import React, { useState } from 'react';
import PropTypes from 'prop-types';

const TaskForm = ({ onTaskCreate, onCancel, initialData = {} }) => {
  const [formData, setFormData] = useState({
    title: initialData.title || '',
    description: initialData.description || '',
    category: initialData.category || 'enhancement',
    priority: initialData.priority || 'medium',
    mode: initialData.mode || 'DEVELOPMENT',
    estimate: initialData.estimate || '',
    dependencies: initialData.dependencies || [],
    requires_research: initialData.requires_research || false,
    ...initialData
  });

  const [errors, setErrors] = useState({});

  const categories = [
    { value: 'research', label: '🔬 Research', priority: 1 },
    { value: 'linter-error', label: '🔴 Linter Error', priority: 2 },
    { value: 'build-error', label: '🔥 Build Error', priority: 3 },
    { value: 'start-error', label: '⚠️ Start Error', priority: 4 },
    { value: 'error', label: '❌ Error', priority: 5 },
    { value: 'missing-feature', label: '🆕 Missing Feature', priority: 6 },
    { value: 'bug', label: '🐛 Bug', priority: 7 },
    { value: 'enhancement', label: '✨ Enhancement', priority: 8 },
    { value: 'refactor', label: '♻️ Refactor', priority: 9 },
    { value: 'documentation', label: '📚 Documentation', priority: 10 },
    { value: 'chore', label: '🧹 Chore', priority: 11 },
    { value: 'missing-test', label: '🧪 Missing Test', priority: 12 }
  ];

  const priorities = [
    { value: 'critical', label: 'Critical' },
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' }
  ];

  const modes = [
    { value: 'DEVELOPMENT', label: 'Development' },
    { value: 'TESTING', label: 'Testing' },
    { value: 'DEBUGGING', label: 'Debugging' },
    { value: 'REFACTORING', label: 'Refactoring' },
    { value: 'RESEARCH', label: 'Research' }
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    if (!formData.category) {
      newErrors.category = 'Category is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    const taskData = {
      ...formData,
      title: formData.title.trim(),
      description: formData.description.trim(),
      dependencies: formData.dependencies.filter(dep => dep.trim())
    };
    
    onTaskCreate(taskData);
  };

  const handleDependencyChange = (index, value) => {
    const newDependencies = [...formData.dependencies];
    newDependencies[index] = value;
    setFormData(prev => ({ ...prev, dependencies: newDependencies }));
  };

  const addDependency = () => {
    setFormData(prev => ({
      ...prev,
      dependencies: [...prev.dependencies, '']
    }));
  };

  const removeDependency = (index) => {
    setFormData(prev => ({
      ...prev,
      dependencies: prev.dependencies.filter((_, i) => i !== index)
    }));
  };

  return (
    <div style={{
      backgroundColor: '#fff',
      border: '1px solid #e1e5e9',
      borderRadius: '8px',
      padding: '24px',
      maxWidth: '600px',
      margin: '0 auto',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <h2 style={{
        fontSize: '24px',
        fontWeight: '600',
        marginBottom: '24px',
        color: '#1a1a1a'
      }}>
        {initialData.id ? 'Edit Task' : 'Create New Task'}
      </h2>
      
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '16px' }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '500',
            marginBottom: '4px',
            color: '#374151'
          }}>
            Title *
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: errors.title ? '1px solid #ef4444' : '1px solid #d1d5db',
              borderRadius: '4px',
              fontSize: '14px',
              boxSizing: 'border-box'
            }}
            placeholder="Enter task title..."
          />
          {errors.title && (
            <span style={{ color: '#ef4444', fontSize: '12px' }}>{errors.title}</span>
          )}
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '500',
            marginBottom: '4px',
            color: '#374151'
          }}>
            Description *
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: errors.description ? '1px solid #ef4444' : '1px solid #d1d5db',
              borderRadius: '4px',
              fontSize: '14px',
              resize: 'vertical',
              boxSizing: 'border-box'
            }}
            placeholder="Describe the task in detail..."
          />
          {errors.description && (
            <span style={{ color: '#ef4444', fontSize: '12px' }}>{errors.description}</span>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              marginBottom: '4px',
              color: '#374151'
            }}>
              Category *
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: errors.category ? '1px solid #ef4444' : '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '14px',
                backgroundColor: '#fff',
                boxSizing: 'border-box'
              }}
            >
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
            {errors.category && (
              <span style={{ color: '#ef4444', fontSize: '12px' }}>{errors.category}</span>
            )}
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              marginBottom: '4px',
              color: '#374151'
            }}>
              Priority
            </label>
            <select
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '14px',
                backgroundColor: '#fff',
                boxSizing: 'border-box'
              }}
            >
              {priorities.map(priority => (
                <option key={priority.value} value={priority.value}>
                  {priority.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              marginBottom: '4px',
              color: '#374151'
            }}>
              Mode
            </label>
            <select
              name="mode"
              value={formData.mode}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '14px',
                backgroundColor: '#fff',
                boxSizing: 'border-box'
              }}
            >
              {modes.map(mode => (
                <option key={mode.value} value={mode.value}>
                  {mode.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              marginBottom: '4px',
              color: '#374151'
            }}>
              Estimate
            </label>
            <input
              type="text"
              name="estimate"
              value={formData.estimate}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
              placeholder="e.g., 2 hours, 1 day"
            />
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            fontSize: '14px',
            fontWeight: '500',
            color: '#374151',
            cursor: 'pointer'
          }}>
            <input
              type="checkbox"
              name="requires_research"
              checked={formData.requires_research}
              onChange={handleChange}
              style={{ marginRight: '8px' }}
            />
            Requires Research
          </label>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '500',
            marginBottom: '8px',
            color: '#374151'
          }}>
            Dependencies
          </label>
          {formData.dependencies.map((dep, index) => (
            <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <input
                type="text"
                value={dep}
                onChange={(e) => handleDependencyChange(index, e.target.value)}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
                placeholder="Task ID or description"
              />
              <button
                type="button"
                onClick={() => removeDependency(index)}
                style={{
                  padding: '8px 12px',
                  backgroundColor: '#ef4444',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addDependency}
            style={{
              padding: '8px 16px',
              backgroundColor: '#f3f4f6',
              color: '#374151',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            + Add Dependency
          </button>
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              style={{
                padding: '12px 24px',
                backgroundColor: '#f3f4f6',
                color: '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            style={{
              padding: '12px 24px',
              backgroundColor: '#3b82f6',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            {initialData.id ? 'Update Task' : 'Create Task'}
          </button>
        </div>
      </form>
    </div>
  );
};

TaskForm.propTypes = {
  onTaskCreate: PropTypes.func.isRequired,
  onCancel: PropTypes.func,
  initialData: PropTypes.object
};

export default TaskForm;