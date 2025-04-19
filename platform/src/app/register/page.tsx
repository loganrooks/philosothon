import FormEmbed from "@/components/FormEmbed";
import InstructionBlock from "@/components/InstructionBlock";

export default function RegisterPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-gray-300 border-b pb-2">Register for Philosothon</h1>

      <p className="mb-6 text-gray-300">
        Sign up below to participate in the upcoming Philosothon event. We look forward to seeing you there!
      </p>

      {/* Embedded Google Form */}
      <FormEmbed />

      {/* Instructions */}
      <InstructionBlock />

    </div>
  );
}