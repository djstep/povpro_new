import { PageEditor } from '@/components/admin/PageEditor';

type Props = { params: Promise<{ slug: string[] }> };

function decodeSlug(segments: string[]): string {
  const joined = segments.map(decodeURIComponent).join('/');
  return joined === 'home' ? '' : joined;
}

export default async function AdminPageEditorPage({ params }: Props) {
  const slugPath = decodeSlug((await params).slug ?? []);

  return <PageEditor slugPath={slugPath} />;
}
