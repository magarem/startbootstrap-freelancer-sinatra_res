require 'sinatra'
require 'pry'
require 'yaml'
require 'liquid'
require 'pony'
require 'json'
require 'mini_magick'

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

post '/s' , :provides => :json do

  # I'd use a 201 as the status if actually creating something,
  # 200 while testing.
  # I'd send the JSON back as a confirmation too, hence the
  # :provides => :json
  #@data = JSON.parse params
  data = YAML.load_file "site.yml"
  data["pages"]["home"]["label"] = params["element-0"]["value"]
  #data["pages"]["home"]["label"] = params["element-0"]["value"]
  File.open("site.yml", 'w') { |f| YAML.dump(data, f) }
    
  
  #pry
  # do something with the data, then…
  #halt 200, data.to_json
  # halt because there's no need to render anything
  # and it's convenient for setting the status too
  #render body: "raw"
  
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

# Handle POST-request (Receive and save the uploaded file)
post "/upload" do 
  #@name = params[:name]
  #pry
  @filename = params[:file][:filename]
  file = params[:file][:tempfile]

  File.open("./public/img/#{@filename}", 'wb') do |f|
    f.write(file.read)
  end
  
  image = MiniMagick::Image.open("./public/img/#{@filename}")
  image.resize "600x600" 
  image.write "./public/img/#{@filename}"
  # return "The file was successfully uploaded!"


  data = YAML.load_file "site.yml"
  data["pages"]["home"]["img"] = "img/#{@filename}"
  File.open("site.yml", 'w') { |f| YAML.dump(data, f) }

  redirect '/'
end
