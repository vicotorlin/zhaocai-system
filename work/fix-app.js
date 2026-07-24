const fs = require("fs");
const file = "C:/Users/linguodong/Documents/Codex/2026-07-07/new-chat-2/supplier-quote/src/App.tsx";
let content = fs.readFileSync(file, "utf-8");

// Replace useEffect/reset with state-based approach
const oldUE = '  useEffect(() => {\n    if (!bidId || !supplierAccount) return\n    fetch(`${API_BASE}/api/supplier/bid/` + bidId + "?account=" + encodeURIComponent(supplierAccount))\n      .then(r => r.json())\n      .then(json => {\n        if (json.success && json.data) {\n          const b = json.data\n          reset({ items: b.items.map((it) => ({ materialName: it.materialName || "", spec: it.spec || "", quantity: it.quantity || 1, unitPrice: it.unitPrice || 0 })) })\n        }\n      })\n      .catch(() => {})\n  }, [bidId, supplierAccount, reset])';

const newUE = '  const [editData, setEditData] = useState<any>(null);\n  useEffect(() => {\n    if (!bidId || !supplierAccount) return\n    fetch(API_BASE + "/api/supplier/bid/" + bidId + "?account=" + encodeURIComponent(supplierAccount))\n      .then(r => r.json())\n      .then(json => {\n        if (json.success && json.data) {\n          setEditData(json.data);\n        }\n      })\n      .catch(() => {})\n  }, [bidId, supplierAccount])';

content = content.replace(oldUE, newUE);

// Replace useForm to use values prop
const oldForm = '  const {\n    control,\n    register,\n    handleSubmit,\n    watch,\n    reset,\n    formState: { errors },\n  } = useForm<QuoteFormValues>({\n    resolver: zodResolver(quoteFormSchema),\n    defaultValues: {\n      items: [{ materialName: "", spec: "", quantity: 1, unitPrice: 0 }],\n    },\n  })';

const newForm = '  const {\n    control,\n    register,\n    handleSubmit,\n    watch,\n    formState: { errors },\n  } = useForm<QuoteFormValues>({\n    resolver: zodResolver(quoteFormSchema),\n    values: editData ? { items: editData.items.map((it: any) => ({ materialName: it.materialName || "", spec: it.spec || "", quantity: it.quantity || 1, unitPrice: it.unitPrice || 0 })) } : undefined,\n    defaultValues: {\n      items: [{ materialName: "", spec: "", quantity: 1, unitPrice: 0 }],\n    },\n  })';

content = content.replace(oldForm, newForm);

// Remove unused useCallback import
content = content.replace(', useCallback', '');

fs.writeFileSync(file, content, "utf-8");
console.log("Updated successfully");
