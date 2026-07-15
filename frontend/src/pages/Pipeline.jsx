import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Phone, IndianRupee } from 'lucide-react';
import { pipelineApi } from '../api/endpoints';
import { Badge } from '../components/ui';

const STAGE_COLORS = {
  'New Lead': 'border-t-blue-400',
  Contacted: 'border-t-amber-400',
  Interested: 'border-t-purple-400',
  'Meeting Scheduled': 'border-t-indigo-400',
  'Proposal Sent': 'border-t-cyan-400',
  Negotiation: 'border-t-amber-500',
  Won: 'border-t-brand-500',
  Lost: 'border-t-red-400',
};

export default function Pipeline() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['pipeline'],
    queryFn: () => pipelineApi.get().then((r) => r.data.data),
  });

  const moveMutation = useMutation({
    mutationFn: ({ leadId, status }) => pipelineApi.move(leadId, status),
    onError: () => {
      toast.error('Failed to move lead');
      qc.invalidateQueries({ queryKey: ['pipeline'] });
    },
  });

  const onDragEnd = (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const newStatus = destination.droppableId;

    // Optimistic update
    qc.setQueryData(['pipeline'], (old) => {
      if (!old) return old;
      const grouped = { ...old.grouped };
      const sourceList = [...grouped[source.droppableId]];
      const [moved] = sourceList.splice(source.index, 1);
      grouped[source.droppableId] = sourceList;
      const destList = [...grouped[destination.droppableId]];
      destList.splice(destination.index, 0, { ...moved, status: newStatus });
      grouped[destination.droppableId] = destList;
      return { ...old, grouped };
    });

    moveMutation.mutate({ leadId: draggableId, status: newStatus });
  };

  if (isLoading) {
    return (
      <div className="flex gap-4 overflow-x-auto">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="skeleton h-96 w-64 shrink-0" />
        ))}
      </div>
    );
  }

  const { stages, grouped } = data;

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {stages.map((stage) => (
          <div key={stage} className="w-72 shrink-0">
            <div className={`card border-t-4 ${STAGE_COLORS[stage] || 'border-t-ink-400'} p-3 mb-2 flex items-center justify-between`}>
              <h3 className="font-display font-bold text-sm">{stage}</h3>
              <span className="badge bg-ink-100 dark:bg-ink-800 text-ink-500">{grouped[stage]?.length || 0}</span>
            </div>
            <Droppable droppableId={stage}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`space-y-2 min-h-[120px] rounded-xl p-1.5 transition-colors ${
                    snapshot.isDraggingOver ? 'bg-brand-500/5' : ''
                  }`}
                >
                  {(grouped[stage] || []).map((lead, index) => (
                    <Draggable key={lead._id} draggableId={lead._id} index={index}>
                      {(dragProvided, dragSnapshot) => (
                        <div
                          ref={dragProvided.innerRef}
                          {...dragProvided.draggableProps}
                          {...dragProvided.dragHandleProps}
                          className={`card p-3 cursor-grab active:cursor-grabbing ${
                            dragSnapshot.isDragging ? 'shadow-glow rotate-1' : ''
                          }`}
                        >
                          <Link to={`/leads/${lead._id}`} className="font-semibold text-sm hover:text-brand-600 dark:hover:text-brand-400">
                            {lead.businessName}
                          </Link>
                          <div className="mt-1.5 flex items-center justify-between">
                            <Badge>{lead.priority}</Badge>
                            {lead.dealValue > 0 && (
                              <span className="flex items-center text-xs text-ink-500">
                                <IndianRupee size={11} /> {lead.dealValue.toLocaleString('en-IN')}
                              </span>
                            )}
                          </div>
                          {lead.phone && (
                            <p className="mt-1.5 flex items-center gap-1 text-xs text-ink-400">
                              <Phone size={11} /> {lead.phone}
                            </p>
                          )}
                          {lead.assignedTo && (
                            <p className="mt-1 text-[11px] text-ink-400">Assigned: {lead.assignedTo.name}</p>
                          )}
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </div>
    </DragDropContext>
  );
}
