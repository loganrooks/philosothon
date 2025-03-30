interface WorkshopCardProps {
  title: string;
  description: string;
  facilitator?: string;
  // Add other props as needed, e.g., relevant themes, capacity
}

const WorkshopCard: React.FC<WorkshopCardProps> = ({ title, description, facilitator }) => {
  // TODO: Refine styling and add more details if necessary
  return (
    <div className="border rounded-lg p-4 mb-4 shadow-sm bg-white">
      <h3 className="text-xl font-semibold mb-2 text-gray-800">{title}</h3>
      {facilitator && <p className="text-sm text-gray-500 mb-2">Facilitator: {facilitator}</p>}
      <p className="text-gray-600">{description}</p>
    </div>
  );
};

export default WorkshopCard;