export function serializeSchema(data: any): string {
    if (!data) return '';
    const safeJson = JSON.stringify(data)
        .replace(/</g, '\\u003c')
        .replace(/>/g, '\\u003e')
        .replace(/\//g, '\\/');
    return `<script type="application/ld+json">${safeJson}<\/script>`;
}


