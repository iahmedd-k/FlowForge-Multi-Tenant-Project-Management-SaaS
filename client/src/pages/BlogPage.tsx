import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

const BlogPage = () => {
  const posts = [
    { title: "The Future of AI in Project Management", date: "April 2, 2026", tag: "AI", img: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&q=80&w=600&h=400" },
    { title: "How Vistra Increased Efficiency by 300%", date: "March 20, 2026", tag: "Case Study", img: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=600&h=400" },
    { title: "5 Tips to Streamline Remote Workflows", date: "March 10, 2026", tag: "Advice", img: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=600&h=400" },
    { title: "Introducing FlowForge 2.0 with Dark Mode", date: "February 28, 2026", tag: "Product", img: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=600&h=400" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <div className="flex-1 container max-w-6xl py-24">
         <h1 className="text-5xl font-display font-medium text-gray-900 mb-6 font-bold">Blog</h1>
         <p className="text-xl text-gray-500 mb-16">Stories, updates, and advice from the FlowForge team.</p>
         
         <div className="grid md:grid-cols-2 gap-8">
            {posts.map((post, idx) => (
               <div key={idx} className="bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-shadow group cursor-pointer">
                  <div className="h-64 overflow-hidden relative">
                     <img src={post.img} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" alt="blog" />
                     <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-gray-900">
                        {post.tag}
                     </div>
                  </div>
                  <div className="p-8">
                     <div className="text-sm text-gray-400 font-medium mb-3">{post.date}</div>
                     <h2 className="text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{post.title}</h2>
                  </div>
               </div>
            ))}
         </div>
      </div>
      <Footer />
    </div>
  );
};

export default BlogPage;
