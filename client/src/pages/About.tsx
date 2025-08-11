
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HeadphonesIcon, Music, ArrowUp } from "lucide-react";

const About = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 animate-fade-in px-4 sm:px-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="p-4 sm:p-6 bg-sarang-coral rounded-full transition-colors duration-300">
            <HeadphonesIcon className="h-12 w-12 sm:h-16 sm:w-16 text-white" />
          </div>
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-sarang-charcoal transition-colors duration-300 font-['Montserrat']">
          About Sarang
        </h1>
        <p className="text-base sm:text-lg text-sarang-brown max-w-2xl mx-auto px-4 transition-colors duration-300 font-['Montserrat'] font-semibold">
          Discover the science and heart behind our mood-based music therapy platform
        </p>
      </div>

      {/* Mission */}
      <Card className="bg-sarang-cream backdrop-blur-sm border-2 border-black rounded-xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardHeader className="px-0 sm:px-6">
          <CardTitle className="text-xl sm:text-2xl text-sarang-charcoal transition-colors duration-300 font-['Montserrat']">Our Mission</CardTitle>
        </CardHeader>
        <CardContent className="px-0 sm:px-6">
          <p className="text-base sm:text-lg text-sarang-charcoal leading-relaxed transition-colors duration-300 font-['Montserrat'] font-semibold">
            Sarang, meaning "love" in Korean, represents our commitment to providing compassionate, 
            AI-powered music therapy. We believe that music has the power to heal, uplift, and 
            transform emotional states. Our platform combines cutting-edge sentiment analysis with 
            proven music therapy principles to create personalized healing experiences.
          </p>
        </CardContent>
      </Card>

      {/* How It Works */}
      <Card className="bg-sarang-cream backdrop-blur-sm border-2 border-black rounded-xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardHeader className="px-0 sm:px-6">
          <CardTitle className="flex items-center space-x-2 text-sarang-charcoal transition-colors duration-300 font-['Montserrat']">
            <Music className="w-5 h-5 sm:w-6 sm:h-6 text-sarang-coral" />
            <span>The Science Behind Sarang</span>
          </CardTitle>
          <CardDescription className="text-sarang-brown transition-colors duration-300 font-['Montserrat'] font-semibold">
            Understanding the technology and methodology that powers your therapeutic journey
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 px-0 sm:px-6">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-sarang-coral rounded-full flex items-center justify-center mx-auto">
                <span className="text-2xl">🧠</span>
              </div>
              <h3 className="font-semibold text-sarang-charcoal font-['Montserrat']">Sentiment Analysis</h3>
              <p className="text-sm text-sarang-brown font-['Montserrat'] font-semibold">
                Advanced AI analyzes your written emotions using natural language processing to understand your current mood state
              </p>
            </div>

            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-sarang-navy rounded-full flex items-center justify-center mx-auto">
                <span className="text-2xl">🎵</span>
              </div>
              <h3 className="font-semibold text-sarang-charcoal font-['Montserrat']">ISO Principle</h3>
              <p className="text-sm text-sarang-brown font-['Montserrat'] font-semibold">
                We use the Iso-Moodia principle, matching your current mood first, then gradually introducing more uplifting music
              </p>
            </div>

            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-sarang-brown rounded-full flex items-center justify-center mx-auto">
                <span className="text-2xl">📈</span>
              </div>
              <h3 className="font-semibold text-sarang-charcoal font-['Montserrat']">Gradual Uplift</h3>
              <p className="text-sm text-sarang-brown font-['Montserrat'] font-semibold">
                Playlists are carefully crafted to slowly increase valence and energy, leading you to a more positive state
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Music Therapy Benefits */}
      <Card className="bg-sarang-cream backdrop-blur-sm border-2 border-black rounded-xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-sarang-charcoal font-['Montserrat']">
            <ArrowUp className="w-6 h-6 text-sarang-coral" />
            <span>Benefits of Music Therapy</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold text-sarang-charcoal font-['Montserrat']">Emotional Benefits</h4>
              <ul className="space-y-2 text-sm text-sarang-brown font-['Montserrat'] font-semibold">
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-sarang-coral rounded-full"></div>
                  <span>Reduces stress and anxiety levels</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-sarang-navy rounded-full"></div>
                  <span>Improves mood and emotional regulation</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-sarang-brown rounded-full"></div>
                  <span>Enhances emotional expression and processing</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-sarang-gray rounded-full"></div>
                  <span>Promotes relaxation and mindfulness</span>
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-sarang-charcoal font-['Montserrat']">Physical Benefits</h4>
              <ul className="space-y-2 text-sm text-sarang-brown font-['Montserrat'] font-semibold">
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-sarang-coral rounded-full"></div>
                  <span>Lowers heart rate and blood pressure</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-sarang-navy rounded-full"></div>
                  <span>Releases endorphins and dopamine</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-sarang-brown rounded-full"></div>
                  <span>Improves sleep quality</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-sarang-gray rounded-full"></div>
                  <span>Boosts immune system function</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Research & Evidence */}
      <Card className="bg-sarang-cream backdrop-blur-sm border-2 border-black rounded-xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardHeader>
          <CardTitle className="text-sarang-charcoal font-['Montserrat']">Research & Evidence</CardTitle>
          <CardDescription className="text-sarang-brown font-['Montserrat'] font-semibold">
            Scientific foundations supporting music therapy effectiveness
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-sarang-coral border border-black rounded-lg p-4">
            <h4 className="font-semibold text-white mb-2 font-['Montserrat']">Clinical Studies</h4>
            <p className="text-sm text-white font-['Montserrat'] font-semibold">
              Multiple peer-reviewed studies have demonstrated that structured music therapy can reduce 
              symptoms of depression by up to 25% and anxiety by up to 30% in participants over an 8-week period.
            </p>
          </div>

          <div className="bg-sarang-navy border border-black rounded-lg p-4">
            <h4 className="font-semibold text-white mb-2 font-['Montserrat']">Neurological Impact</h4>
            <p className="text-sm text-white font-['Montserrat'] font-semibold">
              Brain imaging studies show that music therapy activates the release of neurotransmitters 
              like serotonin and dopamine, which are crucial for mood regulation and emotional well-being.
            </p>
          </div>

          <div className="bg-sarang-brown border border-black rounded-lg p-4">
            <h4 className="font-semibold text-white mb-2 font-['Montserrat']">Professional Recognition</h4>
            <p className="text-sm text-white font-['Montserrat'] font-semibold">
              Music therapy is recognized by healthcare professionals worldwide and is used in hospitals, 
              mental health facilities, and wellness centers as a complementary treatment approach.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* External Resources */}
      <Card className="bg-sarang-cream backdrop-blur-sm border-2 border-black rounded-xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardHeader>
          <CardTitle className="text-sarang-charcoal font-['Montserrat']">Learn More</CardTitle>
          <CardDescription className="text-sarang-brown font-['Montserrat'] font-semibold">
            Explore additional resources about music therapy and mental wellness
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <Button 
              variant="outline" 
              className="bg-[#213447] border-2 border-black text-white hover:bg-[#213447]/90 font-['Montserrat'] rounded-lg"
              onClick={() => window.open('https://www.musictherapy.org/', '_blank')}
            >
              American Music Therapy Association
            </Button>
            <Button 
              variant="outline" 
              className="bg-[#213447] border-2 border-black text-white hover:bg-[#213447]/90 font-['Montserrat'] rounded-lg"
              onClick={() => window.open('https://www.nimh.nih.gov/health/topics/mental-health-information', '_blank')}
            >
              Mental Health Resources
            </Button>
            <Button 
              variant="outline" 
              className="bg-[#213447] border-2 border-black text-white hover:bg-[#213447]/90 font-['Montserrat'] rounded-lg"
              onClick={() => window.open('https://www.who.int/news-room/fact-sheets/detail/mental-disorders', '_blank')}
            >
              WHO Mental Health Facts
            </Button>
            <Button 
              variant="outline" 
              className="bg-[#213447] border-2 border-black text-white hover:bg-[#213447]/90 font-['Montserrat'] rounded-lg"
              onClick={() => window.open('https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4961957/', '_blank')}
            >
              Music Therapy Research
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Call to Action */}
      <Card className="bg-transparent border-2 border-black rounded-xl shadow-lg">
        <CardContent className="pt-6 text-center space-y-4">
          <h3 className="text-2xl font-bold text-sarang-charcoal font-['Montserrat']">
            Ready to Start Your Healing Journey?
          </h3>
          <p className="text-sarang-brown max-w-2xl mx-auto font-['Montserrat'] font-semibold">
            Experience the power of personalized music therapy. Share your feelings, 
            discover your perfect playlist, and take the first step towards emotional wellness.
          </p>
          <Button 
            size="lg" 
            className="bg-[#213447] hover:bg-[#213447]/90 text-white font-['Montserrat']"
            onClick={() => window.location.href = '/'}
          >
            Start Your Session
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default About;
