const Footer = () => {
  return (
    <footer className="bg-white">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex justify-center md:justify-start space-x-6">
            <a href="https://github.com/vikash-kushwah/facial-authentication-system" className="text-gray-400 hover:text-gray-500" target="_blank" rel="noopener noreferrer">
              <span className="sr-only">GitHub</span>
              <i className="fab fa-github text-lg"></i>
            </a>
            <a href="#" className="text-gray-400 hover:text-gray-500">
              <span className="sr-only">Twitter</span>
              <i className="fab fa-twitter text-lg"></i>
            </a>
            <a href="#" className="text-gray-400 hover:text-gray-500">
              <span className="sr-only">LinkedIn</span>
              <i className="fab fa-linkedin text-lg"></i>
            </a>
          </div>
          <div className="mt-8 md:mt-0">
            <p className="text-center text-sm text-gray-500">&copy; {new Date().getFullYear()} FaceAuth. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
