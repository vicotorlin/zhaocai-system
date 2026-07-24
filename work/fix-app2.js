const fs = require("fs");
const file = "C:/Users/linguodong/Documents/Codex/2026-07-07/new-chat-2/supplier-quote/src/App.tsx";
let content = fs.readFileSync(file, "utf-8");

// 1. Remove editData approach, go back to simpler approach
// Replace editData + useEffect with a simpler useMemo approach
const old1 = '  const [editData, setEditData] = useState<any>(null);\n  useEffect(() => {\n    if (!bidId || !supplierAccount) return\n    fetch(API_BASE + "/api/supplier/bid/" + bidId + "?account=" + encodeURIComponent(supplierAccount))\n      .then(r => r.json())\n      .then(json => {\n        if (json.success && json.data) {\n          setEditData(json.data);\n        }\n      })\n      .catch(() => {})\n  }, [bidId, supplierAccount])';

const new1 = '  // 修改模式：加载已有报价数据\n  const [editData, setEditData] = useState<any>(null);\n  const [editLoading, setEditLoading] = useState(!!bidId);\n  useEffect(() => {\n    if (!bidId || !supplierAccount) { setEditLoading(false); return; }\n    fetch(API_BASE + "/api/supplier/bid/" + bidId + "?account=" + encodeURIComponent(supplierAccount))\n      .then(r => r.json())\n      .then(json => {\n        if (json.success && json.data) {\n          setEditData(json.data);\n        }\n        setEditLoading(false);\n      })\n      .catch(() => { setEditLoading(false); })\n  }, [bidId, supplierAccount])';

content = content.replace(old1, new1);

// 2. Replace useForm values with defaultValues + key approach
const old2 = '  const {\n    control,\n    register,\n    handleSubmit,\n    watch,\n    formState: { errors },\n  } = useForm<QuoteFormValues>({\n    resolver: zodResolver(quoteFormSchema),\n    values: editData ? { items: editData.items.map((it: any) => ({ materialName: it.materialName || "", spec: it.spec || "", quantity: it.quantity || 1, unitPrice: it.unitPrice || 0 })) } : undefined,\n    defaultValues: {\n      items: [{ materialName: "", spec: "", quantity: 1, unitPrice: 0 }],\n    },\n  })';

const new2 = '  const defaultItems = editData && editData.items\n    ? editData.items.map((it: any) => ({ materialName: it.materialName || "", spec: it.spec || "", quantity: it.quantity || 1, unitPrice: it.unitPrice || 0 }))\n    : [{ materialName: "", spec: "", quantity: 1, unitPrice: 0 }];\n\n  const {\n    control,\n    register,\n    handleSubmit,\n    watch,\n    formState: { errors },\n  } = useForm<QuoteFormValues>({\n    resolver: zodResolver(quoteFormSchema),\n    defaultValues: {\n      items: defaultItems,\n    },\n  })';

content = content.replace(old2, new2);

// 3. Add key to the form to force re-mount when editData loads
const old3 = '        <form onSubmit={handleSubmit(onSubmit)}>';

const new3 = '        {editLoading ? (\n          <div className="flex items-center justify-center py-20"><div className="text-slate-500 text-lg">加载报价数据...</div></div>\n        ) : (\n        <form onSubmit={handleSubmit(onSubmit)} key={bidId || "new"}>';

content = content.replace(old3, new3);

// 4. Close the editLoading conditional - find </form> and add closing
const old4 = '        </form>\n      </div>\n    </div>\n  )\n}';

const new4 = '        </form>\n        )}\n      </div>\n    </div>\n  )\n}';

content = content.replace(old4, new4);

fs.writeFileSync(file, content, "utf-8");
console.log("Updated with key-based approach");
