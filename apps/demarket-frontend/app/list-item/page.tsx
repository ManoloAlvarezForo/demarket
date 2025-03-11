// app/list-item/page.tsx
import { ListItemForm } from "../components/ListItemForm";

export default function ListItemPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-5xl font-bold mb-8 text-center">List an Item</h1>
        <ListItemForm />
      </div>
    </div>
  );
}
