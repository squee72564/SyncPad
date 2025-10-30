import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";

import SignUp from "@/components/auth/signUp";

const carouselCards = [<></>];

export default function SignUpPage() {
  return (
    <div className="flex flex-col md:flex-row min-h-screen w-full">
      <div className="flex-1 flex items-center justify-center">
        <SignUp className="w-full" />
      </div>
      <div className="flex-1 flex justify-center items-center">
        <Carousel
          className="hidden md:block"
          opts={{
            loop: true,
          }}
          autoplay={true}
          autoplayInterval={2000}
        >
          <CarouselContent>
            {carouselCards.map((card, i) => {
              return <CarouselItem key={i}>{card}</CarouselItem>;
            })}
          </CarouselContent>
        </Carousel>
      </div>
    </div>
  );
}
