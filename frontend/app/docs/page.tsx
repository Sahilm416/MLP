export default function Documentation() {
  return (
    <div className="min-h-screen bg-gradient-to-b bg-white px-4 pb-4">
      <div className="max-w-4xl mx-auto py-12">
        <div className="mb-12">
          <h1 className="text-2xl font-bold mb-4 text-black">Sentiment Analysis For Marathi Language</h1>
          <p className=" text-gray-600">D.K.T.E. Society's Textile and Engineering Institute, Ichalkaranji</p>
          <p className="text-gray-600">An Autonomous Institute, Affiliated to Shivaji University, Kolhapur</p>
          <p className="text-gray-600">Department of Artificial Intelligence and Data Science</p>
          <p className="text-gray-600">2024-2025</p>
        </div>

        {/* Abstract Section */}
        <section className="mb-12">
          <h2 className="text-xl font-bold mb-4 text-black">Abstract</h2>
          <p className="text-gray-700 leading-relaxed">
            Sentiment analysis for Marathi is about analyzing the sentiments of Facebook comments in
            Marathi language. It delivers the output through an app where users can analyze the sentiments
            of comments on Facebook posts.
          </p>
        </section>

        {/* Research Paper Section */}
        <section className="mb-12">
          <h2 className="text-xl font-bold mb-4 text-black">Published Research</h2>
          <p className="text-gray-700 leading-relaxed">
            Our research work has been published in a paper titled "Advanced Deep Learning Approaches for Marathi Sentiment Analysis". 
            You can access the full paper on {' '}
            <a 
              href="https://www.researchgate.net/publication/391020544_Advanced_Deep_Learning_Approaches_for_Marathi_Sentiment_Analysis"
              className="text-blue-600 hover:text-blue-800 underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              ResearchGate
            </a>.
          </p>
        </section>

        {/* Introduction Section */}
        <section className="mb-12">
          <h2 className="text-xl font-bold mb-4 text-black">Introduction</h2>
          <p className="text-gray-700 leading-relaxed">
            Social media has changed how people share their thoughts and feelings, creating a huge
            amount of content every day. This content can help businesses, governments, and researchers
            understand what people think and feel. However, most tools for analyzing sentiments focus
            on popular languages like English, leaving languages like Marathi without proper support.
          </p>
        </section>

        {/* Problem Statement */}
        <section className="mb-12">
          <h2 className="text-xl font-bold mb-4 text-black">Problem Statement</h2>
          <p className="text-gray-700 leading-relaxed">
            Design and develop a strong and effective system for analyzing the sentiment of Marathi
            comments on Facebook posts.
          </p>
        </section>

        {/* Objectives */}
        <section className="mb-12">
          <h2 className="text-xl font-bold mb-4 text-black">Objectives</h2>
          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            <li>Developing a Sentiment Analysis Model for Marathi</li>
            <li>Providing Accurate Sentiment Detection</li>
            <li>Leveraging Deep Learning Techniques</li>
            <li>Building a User-Friendly Application</li>
            <li>Enhancing Regional Language Support</li>
          </ul>
        </section>

        {/* Team Members */}
        <section className="mb-12">
          <h2 className="text-xl font-bold mb-4 text-black">Team Members</h2>
          <ul className="list-none space-y-2 text-gray-700">
            <li>1. Saad Momin (21UAD056)</li>
            <li>2. Sandesh Sawant (21UAD059)</li>
            <li>3. Aman Shaikh (21UAD060)</li>
            <li>4. Sahil Mulani (21UAD035)</li>
            <li>5. Sohel Mujawar (21UAD034)</li>
          </ul>
        </section>

        {/* Project Guides */}
        <section className="mb-12">
          <h2 className="text-xl font-bold mb-4 text-black">Project Guides</h2>
          <div className="text-gray-700">
            <p>Prof. Priyanka S. Koshti - Project Guide</p>
            <p>Prof. Dr. T. I. BAGBAN - Head of Department</p>
          </div>
        </section>
      </div>
    </div>
  );
} 