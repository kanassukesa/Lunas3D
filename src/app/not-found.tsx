import StoreLayout from "./(store)/layout";
import { NotFoundContent } from "@/components/feedback/not-found-content";

// Página 404 global (qualquer URL inexistente), com o header e o footer da loja.
export default function NotFound() {
  return (
    <StoreLayout>
      <NotFoundContent />
    </StoreLayout>
  );
}
