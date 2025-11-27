import { Button } from "@/components/ui/button"

export function ImageToVideo() {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="order-2 lg:order-1">
            <div className="grid grid-cols-3 gap-4">
              <img
                src="/cute-golden-retriever-puppy-portrait.jpg"
                alt="示例图片"
                className="rounded-xl w-full aspect-square object-cover border border-border"
              />
              <img
                src="/elegant-cat-portrait-artistic-photography.jpg"
                alt="示例图片"
                className="rounded-xl w-full aspect-square object-cover border border-border"
              />
              <img
                src="/orange-robot-toy-cute-3d-render.jpg"
                alt="示例图片"
                className="rounded-xl w-full aspect-square object-cover border border-border"
              />
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <h3 className="text-2xl font-bold mb-4 text-foreground">使用免费AI图片转视频生成器，轻松将图片变成视频</h3>
            <p className="text-muted-foreground mb-6">
              只需上传一张图片，MindVideo的AI图片转视频功能就能将静态图片转换为动态视频。支持多种运动效果和风格，让您的图片栩栩如生。
            </p>
            <Button className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black font-medium">
              开始图片转视频 →
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
