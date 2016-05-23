//********************************************************
/**
 * @file  example.cc 
 *
 * @brief libnavajo example code.
 *
 * @author T.Descombes (descombes@lpsc.in2p3.fr)
 *
 * @version 1	
 * @date 27/01/15
 */
//********************************************************

#include <signal.h> 
#include <string.h> 
#include "libnavajo/libnavajo.hh"
#include "libnavajo/LogStdOutput.hh"
#include "libnavajo/WebSocket.hh"

WebServer *webServer = NULL;

void exitFunction( int dummy )
{
   if (webServer != NULL) webServer->stopService();
}



int main()
{
  // connect signals
  signal( SIGTERM, exitFunction );
  signal( SIGINT, exitFunction );
  
  NVJ_LOG->addLogOutput(new LogStdOutput);
  //NVJ_LOG->addLogOutput(new LogFile("/var/log/navajo.log"));



  webServer = new WebServer;

  webServer->setServerPort(8090);


  //uncomment to switch to https  
  //webServer->setUseSSL(true, "../myCert.pem");


  //uncomment to active X509 auth
  //webServer->setAuthPeerSSL(true, "cachain.pem");
  //webServer->addAuthPeerDN("/C=FR/O=CNRS/OU=UMR5821/CN=Thierry Descombes/emailAddress=thierry.descombes@lpsc.in2p3.fr");

  //webServer->addHostsAllowed(IpNetwork(std::string("134.158.40.0/21")));

  //uncomment to active login/passwd auth
  //webServer->addLoginPass("login","password");



  // Fill the web repository with local files, statically compiled files or dynamic files
  PrecompiledRepository thePrecompRepo("") ;
  webServer->addRepository(&thePrecompRepo);

  LocalRepository myLocalRepo("", "./html");
  webServer->addRepository(&myLocalRepo);


  webServer->startService();

  // Your Processing here !
  //...
  webServer->wait();
  
  LogRecorder::freeInstance();
  return 0;
}
