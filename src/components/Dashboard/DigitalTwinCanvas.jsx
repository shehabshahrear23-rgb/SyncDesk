import React, { useRef, useEffect, useState } from 'react';
import { digitalTwinNodes } from '../../data/mockData';
import { Activity, ExternalLink, ArrowRight, Zap } from 'lucide-react';

const DigitalTwinCanvas = ({ onSelectNode, onNavigateModule }) => {
  const canvasRef = useRef(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [filterMode, setFilterMode] = useState('all');

  const handleNodeClick = (node) => {
    if (onSelectNode) {
      onSelectNode(node);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let pulseOffset = 0;

    const render = () => {
      const width = canvas.width = canvas.parentElement.clientWidth;
      const height = canvas.height = canvas.parentElement.clientHeight || 340;

      ctx.clearRect(0, 0, width, height);

      // Node coordinates scaled
      const scaledNodes = digitalTwinNodes.map(node => ({
        ...node,
        px: (node.x / 100) * width,
        py: (node.y / 100) * height
      }));

      // Filter logic
      const activeNodes = scaledNodes.filter(n => {
        if (filterMode === 'dept') return n.type === 'dept' || n.type === 'hub';
        if (filterMode === 'tech') return n.type === 'tech' || n.type === 'hub';
        if (filterMode === 'region') return n.type === 'region' || n.type === 'hub';
        return true;
      });

      // Draw connection lines & animated data pulses
      pulseOffset = (pulseOffset + 0.012) % 1;

      activeNodes.forEach(node => {
        node.connections.forEach(connId => {
          const target = activeNodes.find(n => n.id === connId);
          if (target) {
            // Glow line background
            ctx.beginPath();
            ctx.moveTo(node.px, node.py);
            ctx.lineTo(target.px, target.py);
            ctx.strokeStyle = (hoveredNode && (hoveredNode.id === node.id || hoveredNode.id === target.id))
              ? 'rgba(0, 240, 255, 0.5)'
              : 'rgba(0, 122, 255, 0.18)';
            ctx.lineWidth = (hoveredNode && (hoveredNode.id === node.id || hoveredNode.id === target.id)) ? 2.5 : 1.5;
            ctx.stroke();

            // Animated pulse dot along the line
            const pulseX = node.px + (target.px - node.px) * pulseOffset;
            const pulseY = node.py + (target.py - node.py) * pulseOffset;

            ctx.beginPath();
            ctx.arc(pulseX, pulseY, 3.5, 0, Math.PI * 2);
            ctx.fillStyle = node.health < 90 ? '#ff9500' : '#00f0ff';
            ctx.shadowColor = '#00f0ff';
            ctx.shadowBlur = 10;
            ctx.fill();
            ctx.shadowBlur = 0;
          }
        });
      });

      // Draw Nodes
      activeNodes.forEach(node => {
        const isHovered = hoveredNode && hoveredNode.id === node.id;
        const radius = node.type === 'hub' ? 20 : 14;

        // Outer Glow Ring
        ctx.beginPath();
        ctx.arc(node.px, node.py, radius + (isHovered ? 10 : 5), 0, Math.PI * 2);
        ctx.fillStyle = isHovered 
          ? 'rgba(0, 240, 255, 0.35)' 
          : (node.health < 90 ? 'rgba(255, 149, 0, 0.15)' : 'rgba(0, 122, 255, 0.12)');
        ctx.fill();

        // Inner Circle Body
        ctx.beginPath();
        ctx.arc(node.px, node.py, radius, 0, Math.PI * 2);
        ctx.fillStyle = node.type === 'hub' 
          ? '#007aff' 
          : (node.health < 90 ? '#ff9500' : '#161922');
        ctx.strokeStyle = isHovered ? '#00f0ff' : 'rgba(255, 255, 255, 0.35)';
        ctx.lineWidth = isHovered ? 2.5 : 1.5;
        ctx.fill();
        ctx.stroke();

        // Center Indicator Dot
        ctx.beginPath();
        ctx.arc(node.px, node.py, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#00e676';
        ctx.shadowColor = '#00e676';
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Label
        ctx.font = `${isHovered ? 'bold 12px' : '11px'} Geist, sans-serif`;
        ctx.fillStyle = isHovered ? '#ffffff' : '#9ca3af';
        ctx.textAlign = 'center';
        ctx.fillText(node.label, node.px, node.py + radius + 16);
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animationFrameId);
  }, [hoveredNode, filterMode]);

  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const width = canvas.width;
    const height = canvas.height;

    const found = digitalTwinNodes.find(node => {
      const px = (node.x / 100) * width;
      const py = (node.y / 100) * height;
      const dist = Math.hypot(mouseX - px, mouseY - py);
      return dist <= 24;
    });

    setHoveredNode(found || null);
  };

  const handleCanvasClick = () => {
    if (hoveredNode) {
      handleNodeClick(hoveredNode);
    }
  };

  return (
    <div className="card-panel glass-panel" style={{ position: 'relative', overflow: 'hidden' }}>
      
      {/* Control Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Activity size={20} color="var(--neon-cyan)" />
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#fff' }}>SyncDesk Interactive Org & Digital Twin Graph</h3>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              ⚡ Click any node to open sector-wise metrics, team roster, active tasks, and direct controls
            </p>
          </div>
        </div>

        {/* Filter Buttons */}
        <div style={{ display: 'flex', gap: '4px', background: 'rgba(0,0,0,0.4)', padding: '3px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
          {['all', 'dept', 'tech', 'region'].map(mode => (
            <button
              key={mode}
              onClick={() => setFilterMode(mode)}
              style={{
                background: filterMode === mode ? 'var(--primary-accent)' : 'transparent',
                color: filterMode === mode ? '#fff' : 'var(--text-muted)',
                border: 'none',
                padding: '4px 10px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: '600',
                cursor: 'pointer',
                textTransform: 'capitalize'
              }}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Graph Canvas Viewport */}
      <div style={{
        width: '100%',
        height: '340px',
        position: 'relative',
        background: 'radial-gradient(ellipse at center, rgba(0, 122, 255, 0.08) 0%, rgba(16, 18, 22, 0.95) 100%)',
        borderRadius: 'var(--radius-sm)',
        border: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        <canvas 
          ref={canvasRef} 
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoveredNode(null)}
          onClick={handleCanvasClick}
          style={{ width: '100%', height: '100%', cursor: hoveredNode ? 'pointer' : 'default' }}
        />

        {/* Floating Node Hover Action Tooltip */}
        {hoveredNode && (
          <div style={{
            position: 'absolute',
            bottom: '16px',
            right: '16px',
            backgroundColor: 'rgba(22, 25, 32, 0.95)',
            border: '1px solid var(--neon-cyan)',
            borderRadius: 'var(--radius)',
            padding: '14px 18px',
            boxShadow: '0 12px 30px rgba(0,0,0,0.7)',
            backdropFilter: 'blur(12px)',
            zIndex: 10,
            minWidth: '240px',
            animation: 'fadeIn 0.15s ease-out'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '14px', fontWeight: '800', color: '#fff' }}>{hoveredNode.label}</span>
              <span style={{ fontSize: '11px', color: 'var(--neon-green)', fontWeight: '700' }}>
                {hoveredNode.health}% Health
              </span>
            </div>
            
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '12px' }}>
              <div>Type: <span style={{ color: '#fff', textTransform: 'uppercase', fontWeight: '600' }}>{hoveredNode.type}</span></div>
              <div>Telemetry Latency: <span style={{ color: 'var(--neon-cyan)' }}>14ms</span></div>
              <div>Connected Dependencies: <span style={{ color: '#fff' }}>{hoveredNode.connections.length} Nodes</span></div>
            </div>

            <button
              onClick={() => handleNodeClick(hoveredNode)}
              style={{
                width: '100%',
                backgroundColor: 'var(--primary-accent)',
                color: '#fff',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                padding: '8px 12px',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justify: 'center',
                gap: '6px',
                boxShadow: '0 0 12px rgba(0, 122, 255, 0.4)'
              }}
            >
              <span>Inspect {hoveredNode.label} Sector</span>
              <ArrowRight size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Quick Access Node Pills Grid at bottom of graph */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingTop: '12px' }}>
        {digitalTwinNodes.map(node => (
          <button
            key={node.id}
            onClick={() => handleNodeClick(node)}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-color)',
              borderRadius: '20px',
              padding: '6px 12px',
              fontSize: '11px',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'var(--transition)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--primary-accent)';
              e.currentTarget.style.color = '#fff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-color)';
              e.currentTarget.style.color = 'var(--text-muted)';
            }}
          >
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: node.health < 90 ? 'var(--warning-amber)' : 'var(--neon-cyan)' }} />
            <span>{node.label}</span>
            <ExternalLink size={10} color="var(--primary-accent)" />
          </button>
        ))}
      </div>

    </div>
  );
};

export default DigitalTwinCanvas;
