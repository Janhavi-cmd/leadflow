import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import toast from 'react-hot-toast';
import api from '../utils/api';

const STATUSES = ['New', 'Contacted', 'Qualified', 'Converted', 'Lost'];
const STATUS_COLORS = {
  New: '#22d3a0', Contacted: '#fbbf24', Qualified: '#9d98ff', Converted: '#22d3ee', Lost: '#f87171'
};

export default function KanbanPage() {
  const [board, setBoard] = useState({});
  const [loading, setLoading] = useState(true);
  const [dragging, setDragging] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/leads/kanban').then(r => setBoard(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleDragStart = () => setDragging(true);

  const handleDragEnd = async (result) => {
    setDragging(false);
    const { source, destination, draggableId } = result;
    if (!destination || (source.droppableId === destination.droppableId && source.index === destination.index)) return;

    const fromCol = source.droppableId;
    const toCol = destination.droppableId;
    if (fromCol === toCol) return;

    // Optimistic update
    const card = board[fromCol][source.index];
    const newBoard = { ...board };
    newBoard[fromCol] = [...(board[fromCol] || [])];
    newBoard[fromCol].splice(source.index, 1);
    newBoard[toCol] = [...(board[toCol] || [])];
    newBoard[toCol].splice(destination.index, 0, { ...card, status: toCol });
    setBoard(newBoard);

    try {
      await api.patch(`/leads/${draggableId}/status`, { status: toCol });
      toast.success(`${card.name} → ${toCol}`);
    } catch {
      setBoard(board); // revert
      toast.error('Failed to update status');
    }
  };

  const total = Object.values(board).reduce((sum, cards) => sum + (cards?.length || 0), 0);

  if (loading) return <div style={{ color: 'var(--text3)', textAlign: 'center', padding: 60 }}>Loading kanban...</div>;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontFamily: 'Syne,sans-serif', fontSize: 22, fontWeight: 800 }}>Kanban Board</h1>
          <p style={{ color: 'var(--text3)', fontSize: 13 }}>{total} leads across {STATUSES.length} stages</p>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text3)', background: 'var(--bg2)', border: '1px solid var(--border)', padding: '6px 12px', borderRadius: 8 }}>
          ⟵ Drag cards to change status
        </div>
      </div>

      <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="kanban-board">
          {STATUSES.map(status => (
            <div key={status} className="kanban-col">
              <div className="kanban-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_COLORS[status], flexShrink: 0 }} />
                  <span className="kanban-title" style={{ color: STATUS_COLORS[status] }}>{status}</span>
                </div>
                <span className="kanban-count">{(board[status] || []).length}</span>
              </div>

              <Droppable droppableId={status}>
                {(provided, snapshot) => (
                  <div
                    className="kanban-cards"
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    style={{
                      background: snapshot.isDraggingOver ? 'rgba(108,99,255,0.05)' : undefined,
                      transition: 'background 0.15s'
                    }}
                  >
                    {(board[status] || []).map((lead, index) => (
                      <Draggable key={lead._id} draggableId={lead._id} index={index}>
                        {(prov, snap) => (
                          <div
                            className={`kanban-card ${snap.isDragging ? 'dragging' : ''}`}
                            ref={prov.innerRef}
                            {...prov.draggableProps}
                            {...prov.dragHandleProps}
                            onClick={() => { if (!dragging) navigate(`/leads/${lead._id}`); }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                              <div style={{ width: 26, height: 26, borderRadius: 6, background: STATUS_COLORS[status], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: 'white', fontFamily: 'Syne,sans-serif', flexShrink: 0, opacity: 0.9 }}>
                                {lead.name[0]}
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div className="kanban-card-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lead.name}</div>
                              </div>
                            </div>
                            <div className="kanban-card-company">{lead.company}</div>
                            <div className="kanban-card-meta">
                              {lead.dealValue > 0 && (
                                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2)' }}>
                                  ₹{lead.dealValue >= 100000 ? `${(lead.dealValue / 100000).toFixed(1)}L` : lead.dealValue.toLocaleString()}
                                </span>
                              )}
                              {lead.aiScore !== undefined && (
                                <span style={{
                                  fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 99,
                                  background: lead.aiScore >= 75 ? 'rgba(34,211,160,0.15)' : lead.aiScore >= 45 ? 'rgba(251,191,36,0.15)' : 'rgba(248,113,113,0.15)',
                                  color: lead.aiScore >= 75 ? '#22d3a0' : lead.aiScore >= 45 ? '#fbbf24' : '#f87171'
                                }}>
                                  AI {lead.aiScore}
                                </span>
                              )}
                            </div>
                            {lead.priority === 'High' && (
                              <div style={{ marginTop: 6 }}>
                                <span style={{ fontSize: 10, color: '#f87171', fontWeight: 700 }}>🔥 HIGH PRIORITY</span>
                              </div>
                            )}
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    {(board[status] || []).length === 0 && (
                      <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text3)', fontSize: 12 }}>
                        Drop here
                      </div>
                    )}
                  </div>
                )}
              </Droppable>

              {/* Column total value */}
              {(board[status] || []).some(l => l.dealValue > 0) && (
                <div style={{ padding: '8px 14px', borderTop: '1px solid var(--border)', background: 'var(--bg3)' }}>
                  <span style={{ fontSize: 11, color: 'var(--text3)' }}>Pipeline: </span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: STATUS_COLORS[status] }}>
                    ₹{(board[status] || []).reduce((s, l) => s + (l.dealValue || 0), 0).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}
