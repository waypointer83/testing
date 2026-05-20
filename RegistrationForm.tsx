import React from 'react';

export const RegistrationForm: React.FC = () => {
  const handleCustomSubmit = () => {
    alert('Form submitted!');
  };

  return (
    <div>
      <h2>Sign Up</h2>
      
      {/* VIOLATION: Non-interactive element (div) used as a button. 
          It lacks a keyboard event handler, a focusable tabindex, and an ARIA role (WCAG 2.1.1 / 4.1.2) */}
      <div 
        className="custom-button" 
        onClick={handleCustomSubmit}
        style={{ cursor: 'pointer', background: 'blue', color: 'white', padding: '10px' }}
      >
        Submit Registration
      </div>

      {/* VIOLATION: Static icon indicator using color alone to convey meaning (WCAG 1.4.1) */}
      <p>
        <span style={{ color: 'red' }}>●</span> Fields marked in red are mandatory.
      </p>
      
      <label>
        Your Email:
        {/* VIOLATION: Form control inside a label but completely lacking an explicit id/htmlFor connection or clean accessible name if nested poorly in some linters */}
        <input type="email" name="email" />
      </label>

      <p></p>
    </div>
  );
};  