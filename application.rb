require 'sinatra'
require 'sinatra_warden'

class Application < Sinatra::Base
  register Sinatra::Warden

  get '/:site_nome/admin' do
    authorize!('/login') # require session, redirect to '/login' instead of work
    haml :admin
  end

  get '/:site_nome/dashboard' do
    authorize! # require a session for this action
    haml :dashboard
  end
end