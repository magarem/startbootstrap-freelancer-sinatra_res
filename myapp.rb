require 'sinatra'
require 'pry'
require 'yaml'
require 'liquid'
require 'pony'
require 'json'
require 'mini_magick'
require 'fileutils'

enable :sessions


configure do
  # App Paths
  set :root, File.dirname(__FILE__)
  set :views, File.dirname(__FILE__) + '/views'
  #set :controlers, File.dirname(__FILE__) + '/controlers'
  set :public_folder, Proc.new { File.join(root, "public") }
  Liquid::Template.file_system = Liquid::LocalFileSystem.new(File.join(File.dirname(__FILE__),'views'))
end

#set :public_folder, File.dirname(__FILE__) + '/public'


get '/:site_nome/logout' do

    session[:logado] = false

    redirect '/'+params[:site_nome]
end

post '/:site_nome/login_do' do

    @form_senha = params["senha"]
    @site_nome = params[:site_nome]
    @data = YAML.load_file(@site_nome+'.yml')

    #Compara a senha digitada no formulário de login com a senha do fonte
    if @form_senha.to_s == @data["senha"].to_s then 
      session[:logado] = true       
    else 
      session[:logado] = false
    end

    redirect '/'+params[:site_nome]
end


get '/:site_nome' do
   site_yaml = YAML.load_file(params[:site_nome]+'.yml')
   liquid :index, :locals => { :data => params[:site_nome], :logado => session[:logado],  :site => site_yaml }
end

get '/create' do
    @logfile = File.open("site.yml","r")
    @contents = @logfile.read
    @logfile.close
    erb :create
end

post '/:site_nome/page_save' , :provides => :json do
  if session[:logado] then
      # I'd use a 201 as the status if actually creating something,
      # 200 while testing.
      # I'd send the JSON back as a confirmation too, hence the
      # :provides => :json
      #@data = JSON.parse params
      site_fonte = params[:site_nome]+".yml"
      data = YAML.load_file site_fonte
      data["pages"]["home"]["label"] = params["element-0"]["value"]
      #data["pages"]["home"]["label"] = params["element-0"]["value"]
      File.open(site_fonte, 'w') { |f| YAML.dump(data, f) }
  end       
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

get "/site_new/:site_nome" do 
    FileUtils.cp("site.yml",params[:site_nome]+".yml")
end

# Handle POST-request (Receive and save the uploaded file)
post "/:site_nome/upload" do 
  if session[:logado] then
      @filename = params[:file][:filename].downcase
      file = params[:file][:tempfile]
      imagem_tipo = params[:file][:type]
      
      #pry
      #@filename = Time.now.to_i.to_s+"."+params["file"][:filename].split(".").last
      
      # Testa para ver se é uma imagem que está sendo enviada
      if (imagem_tipo == 'image/png'  || 
          imagem_tipo == 'image/jpeg' || 
          imagem_tipo == 'image/gif') && 
         file.size < 300000

            @filename = params[:site_nome]+"."+params["file"][:filename].split(".").last.downcase
            File.open("./public/img/#{@filename}", 'wb') do |f|
              f.write(file.read)
            end
            
            image = MiniMagick::Image.open("./public/img/#{@filename}")
            image.resize "600x600"   
            #image.write "./public/img/#{@filename}"
            image.write "./public/img/#{@filename}"
            # return "The file was successfully uploaded!"


            data = YAML.load_file params[:site_nome]+".yml"
            data["pages"]["home"]["img"] = "img/#{@filename}"
            File.open(params[:site_nome]+".yml", 'w') { |f| YAML.dump(data, f) }

      end          
      redirect '/'+params[:site_nome]
  end
end

