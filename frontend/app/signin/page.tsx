import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";

import SignIn from "@/components/auth/signIn";

const carouselCards = [<></>];

export default async function LoginPage() {
  return (
    <div className="flex flex-col md:flex-row min-h-screen w-full">
      <div className="flex-1 flex justify-center items-center">
        <Carousel
          className="hidden md:block"
          opts={{
            loop: true,
          }}
          autoplay={true}
          autoplayInterval={5000}
        >
          <CarouselContent>
            {carouselCards.map((card, i) => {
              return <CarouselItem key={i}>{card}</CarouselItem>;
            })}
          </CarouselContent>
        </Carousel>
      </div>
      <div className="flex-1 flex items-center justify-center">
        <SignIn className="w-full" />
      </div>
    </div>
  );
}
