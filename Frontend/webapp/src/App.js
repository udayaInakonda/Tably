import React, { useState, useEffect } from 'react';
import './App.css';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, CartesianGrid, Legend, ResponsiveContainer } from 'recharts';

const chartTypes = ['Bar', 'Line', 'Pie', 'List', 'Table', 'None'];
const loaderMessages = [
  '🍳 Cooking up your report...',
  '🧾 Checking your receipts...',
  '🧠 Thinking really hard...',
  '🍽️ Plating your data...',
  '🔍 Looking into the kitchen...'
];

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#a4de6c'];

function App() {
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [pendingInput, setPendingInput] = useState(null);
  const [awaitingChartType, setAwaitingChartType] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentLoaderMsg, setCurrentLoaderMsg] = useState('');

  useEffect(() => {
    let interval;
    if (loading) {
      let index = 0;
      setCurrentLoaderMsg(loaderMessages[index]);
      interval = setInterval(() => {
        index = (index + 1) % loaderMessages.length;
        setCurrentLoaderMsg(loaderMessages[index]);
      }, 600);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleSend = async () => {
    if (!userInput.trim() || awaitingChartType || loading) return;

    const input = userInput.trim();
    setMessages(prev => [...prev, { type: 'text', content: `You: ${input}` }]);
    setUserInput('');
    setLoading(true);

    try {
      const res = await fetch('http://localhost:8000/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_query: input }),
      });

      const data = await res.json();
      const { bot_response, requires_visualization } = data;

      setLoading(false);

      // if (requires_validate) {
      //   if (bot_response && bot_response.trim()) {
      //     setMessages(prev => [...prev, { type: 'text', content: `Bot: ${bot_response}` }]);
      //   }
      //   setPendingInput(input);
      //   setAwaitingChartType(true);
      //   return;
      // }

      if (!requires_visualization) {
        if (bot_response && bot_response.trim()) {
          setMessages(prev => [...prev, { type: 'text', content: `Bot: ${bot_response}` }]);
        }
      }


      if (requires_visualization) {
        if (bot_response && bot_response.trim()) {
          setMessages(prev => [
            ...prev,
            { type: 'text', content: 'Bot: Your request can be visualized. Please select a format below, or choose none to receive a text reply.' }
          ]);
        }
        setPendingInput(input);
        setAwaitingChartType(true);
      }
    } catch (err) {
      setLoading(false);
      setMessages(prev => [...prev, { type: 'text', content: 'Bot: Oops! Something went wrong.' }]);
    }
  };


  const handleChartSelect = async (type) => {
    if (!pendingInput || !type) return;

    setMessages(prev => [
      ...prev,
      { type: 'text', content: `Format Selected: ${type}` },
      { type: 'text', content: `→ Sending: ${pendingInput} (Format: ${type})` }
    ]);

    setAwaitingChartType(false);
    setLoading(true);

    try {
      const res = await fetch('http://localhost:8000/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_query: pendingInput,
          visualization: type.toLowerCase()
        }),
      });

      const result = await res.json();

      // Defensive checks
      const chartData = result?.data;
      const chartType = result?.visualization;

      if (!chartData || !chartType) {
        setMessages(prev => [
          ...prev,
          { type: 'text', content: 'Bot: No data returned from server.' }
        ]);
        setLoading(false);
        return;
      }

      setMessages(prev => [
        ...prev,
        { type: 'text', content: `Bot: ✅ Report generated in ${type} format!` },
        { type: 'chart', chartType: chartType.toLowerCase(), data: chartData }
      ]);
    } catch (err) {
      console.error('Chart fetch failed:', err);
      setMessages(prev => [...prev, { type: 'text', content: 'Bot: Failed to get report. Try again.' }]);
    }

    setLoading(false);
    setPendingInput(null);
  };


  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSend();
  };

  return (
    <div className="app">
      {loading && (
        <div className="fullscreen-loader">
          <p>{currentLoaderMsg}</p>
        </div>
      )}

      <header className="header">
        <h1>🍽️ Tably</h1>
      </header>

      <section className="hero">
        <div className="chat-container">
          <div className="welcome-text">
            <h2>Welcome to Tably!</h2>
            <p>How can I assist you today?</p>
          </div>

          <div className="chat-messages">
            {messages.map((msg, index) => (
              <div key={index} className="message">
                {msg.type === 'text' && <p>{msg.content}</p>}

                {msg.type === 'chart' && msg.chartType === 'bar' && (
                  <div className="chart-bubble">
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={msg.data}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="label" stroke="#fff" />
                        <YAxis stroke="#fff" />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="value" fill="#ffb347" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {msg.type === 'chart' && msg.chartType === 'line' && (
                  <div className="chart-bubble">
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={msg.data}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="label" stroke="#fff" />
                        <YAxis stroke="#fff" />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="value" stroke="#82ca9d" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {msg.type === 'chart' && msg.chartType === 'pie' && (
                  <div className="chart-bubble">
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={msg.data}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          label
                        >
                          {msg.data.map((entry, idx) => (
                            <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {msg.type === 'chart' && msg.chartType === 'list' && (
                  <div className="chart-bubble">
                    <ul>
                      {msg.data.map((item, idx) => (
                        <li key={idx}>
                          {typeof item === 'object'
                            ? Object.entries(item)
                              .map(([k, v]) => `${k}: ${v}`)
                              .join(', ')
                            : item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}


                {msg.type === 'chart' && msg.chartType === 'table' && (
                  <div className="chart-bubble">
                    <table>
                      <thead>
                        <tr>
                          {Object.keys(msg.data[0]).map((key, idx) => (
                            <th key={idx}>{key}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {msg.data.map((row, idx) => (
                          <tr key={idx}>
                            {Object.values(row).map((val, i) => (
                              <td key={i}>{val}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {msg.type === 'chart' && msg.chartType === 'none' && (
                  <div className="chart-bubble">
                    <pre style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
                      {JSON.stringify(msg.data, null, 2)}
                    </pre>
                  </div>
                )}


              </div>
            ))}
          </div>

          {awaitingChartType && !loading && (
            <div className="chart-buttons">
              {chartTypes.map((type) => (
                <button key={type} onClick={() => handleChartSelect(type)}>
                  {type}
                </button>
              ))}
            </div>
          )}

          {!awaitingChartType && !loading && (
            <div className="chat-input">
              <input
                type="text"
                placeholder="Type your message..."
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <button onClick={handleSend}>Send</button>
            </div>
          )}
        </div>
      </section>

      <footer className="footer">
        © 2025 Tably. All rights reserved.
      </footer>
    </div>
  );
}

export default App;
