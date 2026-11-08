import './App.css';

function App() {
  return (
    <div className="app">
      <header className="header">
        <h1>School Admission System</h1>

        <p>Online School Admission Portal</p>
      </header>

      <main className="container">
        <section className="welcome-card">
          <h2>Welcome to School Admission Portal</h2>

          <p>
            Apply for school admission online.
            Check available classes and admission status.
          </p>

          <button>
            View Available Classes
          </button>
        </section>

        <section className="status-card">
          <h3>System Status</h3>

          <p>Frontend: Running</p>

          <p>Backend: Not Connected Yet</p>

          <p>Database: PostgreSQL Setup Pending</p>
        </section>
      </main>
    </div>
  );
}

export default App;