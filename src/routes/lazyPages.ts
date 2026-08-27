let myPageModule: Promise<typeof import('../components/MyPage')> | null = null

export function loadMyPage() {
  myPageModule ??= import('../components/MyPage')
  return myPageModule
}

export function prefetchMyPage(): void {
  void loadMyPage()
}
