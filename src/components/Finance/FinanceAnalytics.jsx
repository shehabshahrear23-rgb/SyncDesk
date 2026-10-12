import React, { useState } from 'react';
import { financialData } from '../../data/mockData';
import { DollarSign, TrendingUp, ShieldAlert, Cpu, Layers, ArrowUpRight, Sliders } from 'lucide-react';

const FinanceAnalytics = () => {
  const [trajectoryMode, setTrajectoryMode] = useState('expected'); // 'conservative' | 'expected' | 'optimistic'
  const [selectedRange, setSelectedRange] = useState('YTD');
  const [selectedReport, setSelectedReport] = useState(null);

  const getTrajectoryMultiplier = () => {
    if (trajectoryMode === 'conservative') return 0.85;
    if (trajectoryMode === 'optimistic') return 1.25;
    return 1.0;
  };

  const chartHistory = financialData.chartHistory;
  const maxRevenue = Math.max(...chartHistory.map(d => d.revenue));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* 4 Financial Pulse Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        <div className="card-panel card-panel-hover">
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>YTD Gross Revenue</p>
          <h3 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-main)', margin: '8px 0' }}>
            {financialData.metrics.ytdRevenue}
          </h3>
          <span style={{ fontSize: '11px', color: 'var(--neon-green)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <ArrowUpRight size={14} /> +18.4% vs forecast
          </span>
        </div>

        <div className="card-panel card-panel-hover">
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Monthly Burn / Expenses</p>
          <h3 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-main)', margin: '8px 0' }}>
            {financialData.metrics.monthlyExpenses}
          </h3>
          <span style={{ fontSize: '11px', color: 'var(--primary-accent)', fontWeight: '600' }}>
            Controlled OpEx
          </span>
        </div>

        <div className="card-panel card-panel-hover">
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Net Profit Margin</p>
          <h3 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--neon-green)', margin: '8px 0' }}>
            {financialData.metrics.profitMargin}
          </h3>
          <span style={{ fontSize: '11px', color: 'var(--neon-green)', fontWeight: '600' }}>
            +4.2% expansion
          </span>
        </div>

        <div className="card-panel card-panel-hover">
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Liquidity & Cash Runway</p>
          <h3 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--neon-cyan)', margin: '8px 0' }}>
            {financialData.metrics.cashRunway}
          </h3>
          <span style={{ fontSize: '11px', color: 'var(--neon-cyan)', fontWeight: '600' }}>
            Zero dilution risk
          </span>
        </div>
      </div>

      {/* Main Financial Pulse Chart & AI Predictive Trajectories */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        
        {/* Custom SVG Interactive Financial Pulse Chart */}
        <div className="card-panel glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <TrendingUp size={20} color="var(--primary-accent)" />
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-main)' }}>Revenue Trajectory & Expense Ratio</h3>
            </div>
            
            <div style={{ display: 'flex', gap: '6px' }}>
              {['6M', 'YTD', '1Y'].map(range => (
                <button
                  key={range}
                  onClick={() => setSelectedRange(range)}
                  style={{
                    backgroundColor: selectedRange === range ? 'var(--primary-accent)' : 'transparent',
                    color: selectedRange === range ? '#fff' : 'var(--text-muted)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '4px',
                    padding: '4px 10px',
                    fontSize: '11px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>

          {/* SVG Bar / Line Chart Container */}
          <div style={{ height: '240px', position: 'relative', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '20px 10px 0 10px', background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-sm)' }}>
            {chartHistory.map((item, idx) => {
              const revHeight = (item.revenue / maxRevenue) * 180;
              const expHeight = (item.expense / maxRevenue) * 180;

              return (
                <div 
                  key={idx} 
                  onClick={() => setSelectedReport(item)}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', flex: 1, cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '180px' }}>
                    {/* Revenue Bar */}
                    <div 
                      title={`Revenue: $${item.revenue}M`}
                      style={{
                        width: '18px',
                        height: `${revHeight}px`,
                        background: 'linear-gradient(180deg, #007aff 0%, rgba(0,122,255,0.4) 100%)',
                        borderRadius: '4px 4px 0 0',
                        boxShadow: '0 0 10px rgba(0,122,255,0.2)'
                      }} 
                    />
                    {/* Expense Bar */}
                    <div 
                      title={`Expense: $${item.expense}M`}
                      style={{
                        width: '18px',
                        height: `${expHeight}px`,
                        background: 'linear-gradient(180deg, #ff9500 0%, rgba(255,149,0,0.3) 100%)',
                        borderRadius: '4px 4px 0 0'
                      }} 
                    />
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{item.month}</span>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', fontSize: '12px', color: 'var(--text-muted)', justifyContent: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '12px', height: '12px', backgroundColor: 'var(--primary-accent)', borderRadius: '2px' }} />
              <span>Revenue ($ Millions)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '12px', height: '12px', backgroundColor: 'var(--warning-amber)', borderRadius: '2px' }} />
              <span>Expenses ($ Millions)</span>
            </div>
          </div>
        </div>

        {/* AI Predictive Trajectory Simulator Controls */}
        <div className="card-panel glass-panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Cpu size={18} color="var(--neon-cyan)" />
              <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-main)' }}>Predictive AI Modeling</h3>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Monte Carlo simulation forecasting Q4 ARR under varying macroeconomic conditions.
            </p>

            {/* Scenario Toggles */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {['conservative', 'expected', 'optimistic'].map(mode => (
                <button
                  key={mode}
                  onClick={() => setTrajectoryMode(mode)}
                  style={{
                    backgroundColor: trajectoryMode === mode ? 'rgba(0, 122, 255, 0.15)' : 'rgba(0, 0, 0, 0.2)',
                    border: trajectoryMode === mode ? '1px solid var(--primary-accent)' : '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justify: 'space-between',
                    color: trajectoryMode === mode ? '#fff' : 'var(--text-muted)',
                    cursor: 'pointer'
                  }}
                >
                  <span style={{ fontSize: '13px', fontWeight: '600', textTransform: 'capitalize' }}>{mode} Growth</span>
                  <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--neon-green)' }}>
                    ${(18.5 * (mode === 'conservative' ? 0.85 : mode === 'optimistic' ? 1.25 : 1.0)).toFixed(1)}M ARR
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div style={{ backgroundColor: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', marginTop: '16px' }}>
            <p style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: '600' }}>Selected AI Confidence Score</p>
            <p style={{ fontSize: '14px', fontWeight: '700', color: 'var(--neon-cyan)', marginTop: '2px' }}>96.8% Model Alignment</p>
          </div>
        </div>

      </div>

      {/* Enterprise Risk Matrix Table */}
      <div className="card-panel glass-panel">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <ShieldAlert size={18} color="var(--warning-amber)" />
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-main)' }}>Enterprise Risk Assessment Matrix</h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {financialData.riskAssessments.map((item, idx) => (
            <div key={idx} style={{
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              justify: 'space-between',
              gap: '16px'
            }}>
              <div>
                <p style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-main)' }}>{item.risk}</p>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Mitigation: {item.mitigation}</p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Probability</p>
                  <p style={{ fontSize: '13px', fontWeight: '700', color: 'var(--warning-amber)' }}>{item.probability}</p>
                </div>
                <span className="status-pill" style={{
                  backgroundColor: item.impact === 'High' ? 'rgba(255, 59, 48, 0.15)' : 'rgba(255, 149, 0, 0.15)',
                  color: item.impact === 'High' ? 'var(--danger-red)' : 'var(--warning-amber)'
                }}>
                  {item.impact} Impact
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Report Modal */}
      {selectedReport && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div className="card-panel glass-panel" style={{ width: '400px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#fff' }}>Financial Report: {selectedReport.month}</h3>
              <button onClick={() => setSelectedReport(null)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '16px' }}>&times;</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', color: 'var(--text-muted)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Revenue:</span>
                <span style={{ color: 'var(--neon-green)', fontWeight: 'bold' }}>${selectedReport.revenue}M</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Expense:</span>
                <span style={{ color: 'var(--warning-amber)', fontWeight: 'bold' }}>${selectedReport.expense}M</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '8px' }}>
                <span>Net Profit:</span>
                <span style={{ color: '#fff', fontWeight: 'bold' }}>${(selectedReport.revenue - selectedReport.expense).toFixed(1)}M</span>
              </div>
              <p style={{ marginTop: '12px', fontSize: '13px' }}>
                Clicking this segment provides a detailed breakdown of {selectedReport.month}'s financial activities, including departmental spending and top revenue sources.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinanceAnalytics;
