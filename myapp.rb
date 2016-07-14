require 'sinatra'
require 'pry'
require 'yaml'
require 'liquid'
require 'pony'
require 'json'
require 'mini_magick'
require 'fileutils'


enable :sessions

module IndiceArray
   def self.set_site_nome site_nome
       @site_nome = site_nome       
   end
end

configure do
  # App Paths
  set :root, File.dirname(__FILE__)
  set :views, File.dirname(__FILE__) + '/views'
  #set :controlers, File.dirname(__FILE__) + '/controlers'
  set :public_folder, Proc.new { File.join(root, "public") }
  Liquid::Template.file_system = Liquid::LocalFileSystem.new(File.join(File.dirname(__FILE__),'views'))
end

helpers do
  def h(text)
    Rack::Utils.escape_html(text)
  end
end

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
   
      # Definindo as categorias de portfolio
      
      data = YAML.load_file(params[:site_nome]+'.yml')

      Liquid::Template.register_filter(IndiceArray)

      @cat = IndiceArray.set_site_nome params[:site_nome]
       
      data_portfolio_json = data["pages"]["portfolio"]["items"]
      
      liquid :index, :locals => {:port_cats => @cat, 
                                 :data_portfolio_json => data_portfolio_json.to_json, 
                                 :data => params[:site_nome], 
                                 :logado => session[:logado],  
                                 :site => data }

end



get '/:site_nome/getdata' do      
      data = YAML.load_file(params[:site_nome]+'.yml') || {}
      data["pages"]["portfolio"]["items"].to_json
end


get '/:site_nome/getImgsCategorias' do      
      data = YAML.load_file(params[:site_nome]+'.yml') || {}
      data["pages"]["portfolio"]["items"].to_json
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
      
      data["moldura"]["logo"]["label"] = params["topo"]["value"]
      #data["pages"]["home"]["label"] = params["element-1"]["value"]
      


      #data["pages"]["home"]["label"] = params["element-0"]["value"]
      File.open(site_fonte, 'w') { |f| YAML.dump(data, f) }

      redirect '/'+params[:site_nome]
  end       
end

post '/:site_nome/menu/save' do
  if session[:logado] then

      site_fonte = params[:site_nome]+".yml"
      data = YAML.load_file site_fonte
      
      
        data["moldura"]["menu"][0]["label"] = params[:site_moldura_menu_0_label]
        data["moldura"]["menu"][0]["link"] = params[:site_moldura_menu_0_link]
      
        data["moldura"]["menu"][1]["label"] = params[:site_moldura_menu_1_label]
        data["moldura"]["menu"][1]["link"] = params[:site_moldura_menu_1_link]
      
        data["moldura"]["menu"][2]["label"] = params[:site_moldura_menu_2_label]
        data["moldura"]["menu"][2]["link"] = params[:site_moldura_menu_2_link]
      

      #data["pages"]["home"]["label"] = params["element-0"]["value"]
      File.open(site_fonte, 'w') { |f| YAML.dump(data, f) }

      redirect '/'+params[:site_nome]
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
# 
# 
#     Excluindo um item do portfolio     
#
# 
post "/:site_nome/portfolio/delete/:id" do 

  @site_nome = params[:site_nome]
  @id = params[:id]
  @data = YAML.load_file @site_nome+".yml"
  @data["pages"]["portfolio"]["items"].delete_at(@id.to_i)
  @p = @data["pages"]["portfolio"]["items"]
  # .reject { |n| n 
  #   # % @id.to_i == 0  }  
  
  File.open(@site_nome+".yml", 'w') { |f| YAML.dump(@data, f) }
  "Admin Area, Access denied!"
  #pry
end

#
#
#  Mudança na ordenação
#
#
post "/:site_nome/portfolio/ordena" do

  @siteNome = params[:site_nome]
  @post_data = JSON.parse(request.body.read)  
  #pry  
  data = YAML.load_file @siteNome+".yml"
  
  data["pages"]["portfolio"]["items"] = @post_data  
  
  File.open(@siteNome+".yml", 'w') { |f| YAML.dump(data, f) }
end


post "/:site_nome/portfolio/save/:index" do 

  @site_nome = params[:site_nome]
  @item = params[:item]
  @index = params[:index].to_i

  @file = params[:file]

  port_img = ""
  

  #if session[:logado] then
  data = YAML.load_file params[:site_nome]+".yml"

  unless @file == nil
    #pry
    @filename = params[:file][:filename].downcase
    file = params[:file][:tempfile]
    imagem_tipo = params[:file][:type]
    #@filename = Time.now.to_i.to_s+"."+params["file"][:filename].split(".").last
    # Testa para ver se é uma imagem que está sendo enviada
    if (imagem_tipo == 'image/png'  || 
        imagem_tipo == 'image/jpeg' || 
        imagem_tipo == 'image/gif') && 
        file.size < 600000

          File.open("./public/img/portfolio/#{@filename}", 'wb') do |f|
            f.write(file.read)
          end
          
          image = MiniMagick::Image.open("./public/img/portfolio/#{@filename}")
          image.resize "600x600"   
          #image.write "./public/img/#{@filename}"
          image.write "./public/img/portfolio/#{@filename}"
          #Salva os dados do painel do portfolio
          
          port_img = "img/portfolio/#{@filename}"
    end
  end
  
  def string_limpa str
    str.to_s.gsub(/<\/?[^>]*>/, "").gsub("&nbsp;", "")
  end
  if (port_img == "" || port_img == "undefined" || port_img == nil) then port_img = @item["img"] end
  port_novo = {
    "id"      => @item["id"],
    "titulo"  => string_limpa(@item["titulo"]),
    "img"     => port_img,
    "txt"     => string_limpa(@item["txt"]),
    "cliente" => string_limpa(@item["cliente"]),
    "site"    => string_limpa(@item["site"]),
    "data"    => string_limpa(@item["data"]),
    "servico" => string_limpa(@item["servico"]),
    "cat"     => string_limpa(@item["cat"])
  } 

  data["pages"]["portfolio"]["items"][@index] = port_novo
  
  File.open(params[:site_nome]+".yml", 'w') { |f| YAML.dump(data, f) }
                 
  #redirect '/'+params[:site_nome]
  #end
end

get "/:site_nome/portfolio/add" do 
  
  @site_nome = params[:site_nome]
  
  data = YAML.load_file params[:site_nome]+".yml"
  
  for t in data["pages"]["portfolio"]["items"]
     id_last = t["id"]
  end

  d = { "id" => id_last+1,
        "titulo" => "Novo",
        "img" => "img/noimage.png",
        "txt" => "Txt novo",
        "nome" => "Fidelito",
        "site" => "fidelis.com",
        "data" => "10/10/12",
        "servico" => "Programação"
      }
  
  data["pages"]["portfolio"]["items"][(id_last.to_i)+1] = d
  
  File.open(params[:site_nome]+".yml", 'w') { |f| YAML.dump(data, f) }

  redirect '/'+params[:site_nome]
end

