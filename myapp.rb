require 'sinatra'
require 'pry'
require 'yaml'
require 'liquid'
require 'pony'


configure do
  # App Paths
  set :root, File.dirname(__FILE__)
  set :views, File.dirname(__FILE__) + '/views'
  #set :controlers, File.dirname(__FILE__) + '/controlers'
  set :public_folder, Proc.new { File.join(root, "public") }
  Liquid::Template.file_system = Liquid::LocalFileSystem.new(File.join(File.dirname(__FILE__),'views'))
end

#set :public_folder, File.dirname(__FILE__) + '/public'


get '/' do
   site = YAML.load_file('site.yml')
   liquid :index, :locals => { :site => site }
end

get '/create' do
    @logfile = File.open("site.yml","r")
    @contents = @logfile.read
    @logfile.close
    erb :create
end

post '/create' do
    @logfile = File.open("site.yml","w")
    @logfile.truncate(@logfile.size)
    @logfile.write(params[:file])
    @logfile.close
    redirect '/create'
end

post '/email_envia' do

  name = params[:name]
  email = params[:email]
  phone = params[:phone]
  message = params[:message]
  
  Pony.mail :to => "contato@magaweb.com.br",
            :from => email,
            :subject => "Contato",
            :body => message
end

post '/edit_about_save' do
	data = YAML.load_file "site.yml"
    data["pages"]["about"]["body1"] = params[:about_body1]
    data["pages"]["about"]["body2"] = params[:about_body2]
    File.open("site.yml", 'w') { |f| YAML.dump(data, f) }
    redirect '/'
end
