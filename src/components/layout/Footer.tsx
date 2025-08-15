import React from "react";

const Footer: React.FC = () => {
  return (
    <footer className="bg-dark text-white py-4 mt-auto">
      <div className="container">
        <div className="row">
          <div className="col-md-6">
            <h5>LearnHub</h5>
            <p className="mb-0">Your gateway to online learning</p>
          </div>
          <div className="col-md-6 text-md-end">
            <small>&copy; 2025 LearnHub. All rights reserved.</small>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
