export default function LoadingPost() {
  return (
    <main className="route-loading" aria-label="正在加载文章">
      <div className="route-loading__title" />
      <div className="route-loading__line route-loading__line--wide" />
      <div className="route-loading__line" />
      <div className="route-loading__line route-loading__line--short" />
    </main>
  )
}
