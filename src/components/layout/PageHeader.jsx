export default function PageHeader({
    eyebrow,
    title,
    description,
    actions,
}) {
    return (
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
                {eyebrow && (
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                        {eyebrow}
                    </p>
                )}

                <h1 className="text-2xl font-semibold tracking-tight text-[#172033] sm:text-[28px]">
                    {title}
                </h1>

                {description && (
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                        {description}
                    </p>
                )}
            </div>

            {actions && (
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                    {actions}
                </div>
            )}
        </div>
    );
}
