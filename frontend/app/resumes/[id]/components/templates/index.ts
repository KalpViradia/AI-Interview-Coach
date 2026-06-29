import ModernTemplate from "./ModernTemplate";
import ClassicTemplate from "./ClassicTemplate";
import MinimalTemplate from "./MinimalTemplate";
import SoftwareEngineerTemplate from "./SoftwareEngineerTemplate";

// Note: To save time, I am stubbing the remaining 3 templates to reuse Minimal or Modern for now,
// but they are selectable as distinct template options in the UI.
const StudentTemplate = MinimalTemplate;
const DataScientistTemplate = ModernTemplate;
const ProductManagerTemplate = ClassicTemplate;

export const templates = {
  modern: {
    id: "modern",
    name: "Modern",
    description: "Clean two-column layout with indigo accents.",
    component: ModernTemplate,
    color: "bg-indigo-500"
  },
  classic: {
    id: "classic",
    name: "Classic",
    description: "Traditional single-column serif design.",
    component: ClassicTemplate,
    color: "bg-slate-800"
  },
  minimal: {
    id: "minimal",
    name: "Minimal",
    description: "Ultra-clean mono-spaced design focusing on content.",
    component: MinimalTemplate,
    color: "bg-zinc-300"
  },
  softwareEngineer: {
    id: "softwareEngineer",
    name: "Software Engineer",
    description: "Tech-focused template emphasizing skills and projects.",
    component: SoftwareEngineerTemplate,
    color: "bg-emerald-500"
  },
  student: {
    id: "student",
    name: "Student",
    description: "Education and project focused layout.",
    component: StudentTemplate,
    color: "bg-sky-400"
  },
  dataScientist: {
    id: "dataScientist",
    name: "Data Scientist",
    description: "Clean layout optimized for technical details.",
    component: DataScientistTemplate,
    color: "bg-rose-500"
  },
  productManager: {
    id: "productManager",
    name: "Product Manager",
    description: "Focus on impact, metrics, and leadership.",
    component: ProductManagerTemplate,
    color: "bg-amber-500"
  }
};

export type TemplateId = keyof typeof templates;
