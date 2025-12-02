type QAChatThreadPageProps = {
  threadId: string;
};

export default async function QAChatThreadPage({
  params,
}: {
  params: Promise<QAChatThreadPageProps>;
}) {
  const { threadId } = await params;

  return <>{threadId}</>;
}
