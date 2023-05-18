<template>
	<header>
		<div class="header-bar">
			<h2>Images from {{tableTitle}}</h2>
			<a :href="`/admin/content/${loc}/${id}`">&lt; Back</a>
<!--			<a @click="goBack" style="cursor: pointer">&lt; Back</a>-->
		</div>
    <div class="progress-bar" style="width: 100%; height:5px; background: #18222f;">
      <div :style="{width: progress + '%', height:'5px' ,background: '#00c897'}"></div>
    </div>
	</header>
	<private-view :title="title">
		<div class="gallery">
			<input
          id='file-input'
					type="file"
					ref="imageUpload"
					multiple
					accept="image/*"
					@change="onImageUpload"
					style="display: none;"
			/>
			<div class="buttons">
				<button class="select-images-btn" @click="$refs.imageUpload.click()">Select Images</button>
				<button class="upload-images-btn" @click="uploadImages" :disabled="thumbnails.length === 0">Upload Images</button>
			</div>
      <div class="notification" :class="notificationType" v-if="showNotification">
        {{ notificationMessage }}
      </div>
			<div class="uploaded-thumbnails">
				<div
						v-for="(thumbnail, index) in sortedThumbnails"
						:key="index"
						class="thumbnail-container"
						@click="removeImage(index)"
				>
					<img :src="thumbnail.url" class="thumbnail" />
					<div class="thumbnail-remove">Remove</div>
				</div>
			</div>
			<div v-if="loading" class="loading">Loading...</div>
			<div v-else>
				<div class="image-list" ref="imageList">
					<div
							v-for="(image, index) in paginatedImages"
							:key="image.image"
							class="image-item"
							:data-index="(currentPage - 1) * imagesPerPage + index"
							draggable="true"
							@dragstart="onDragStart"
							@dragover.prevent
							@drop="onDrop"
					>
						<img :src="image.image.replace('.jpg', 't.jpg')" />
					</div>

				</div>
				<custom-pagination
						v-if="totalImages > imagesPerPage"
						:total="totalImages"
						:limit="imagesPerPage"
						:page.sync="currentPage"
						@pagination="handlePagination"
				/>  </div>
		</div>
	</private-view>
</template>

<script>
	import axios from 'axios';
	import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
	import CustomPagination from './CustomPagination.vue';
  async function  wasabi(rid,loc) {
    let bucket = ['img.ragalahari.com', 'media.ragalahari.com', 'starzone.ragalahari.com', 'imgcdn.ragalahari.com',
      'www1.ragalahari.com', 'imgcdn.raagalahari.com', 'img.raagalahari.com', 'timg.raagalahari.com', 'szcdn.ragalahari.com', 'www.ragalahari.com','szcdn1.ragalahari.com']
    //'gallery.ragalahari.com',media1.ragalahari.com,74.52.160.190,media1.ragalahari.com,www.ragalahari.net,www.telugudvdshop.com
//`wasabi` is null

    const response = await axios.get(`/items/${loc}?filter={"rid":${rid}}&fields=rid,permaLink,imageName`);
    let v = response.data.data[0]
    if(!v) return
    return await run(v);
    async function run(val) {
      let selPath = loc === 'movies_poster'?'fileLocation':'path'
      const response2 = await axios.get(`/items/${loc}?filter={"rid":${val.rid}}&fields=${selPath}`);
      let obj = response2.data.data[0]
      if (obj.hasOwnProperty('fileLocation')) {
        obj['path'] = obj['fileLocation'];
        delete obj['fileLocation'];
      }
      if (obj?.path) {
        let Origin = obj.path.replace(/http:\/\//gi, '').split('/')
        let bucketName = Origin[0] == bucket[0] || Origin[0] == bucket[3] || Origin[0] == bucket[4] ||
        Origin[0] == bucket[5] || Origin[0] == bucket[6] || Origin[0] == bucket[7] ? bucket[0] : Origin[0] == bucket[1] || Origin[0] == bucket[9] ? bucket[1] :
            Origin[0] == bucket[2] || Origin[0] == bucket[8] || Origin[0] == bucket[10] ? bucket[2] : 'noFile';

        let remove = bucket.concat('http:///').concat('Http:///')
        let prefix = obj.path

        if (prefix == 'http://www.ragalahari.com/images/') {
          prefix = 'gallery/' + val.imageName + '/'
        } else {
          remove.map(v => {
            prefix = prefix.replace(v, '')
          })
        }
        console.log( bucketName, prefix)
        if (bucketName != 'noFile') {
          return  {
            Bucket: bucketName,
            Prefix: prefix.slice(-1) === "/" ? prefix : prefix + "/",
            imagePath:obj['path']
          };
        } else {
          return {}
        }
      }
    }
  }
	export default  {
		components: {
			CustomPagination,
		},
		data() {
			return {
        progress:100,
        showNotification: false,
        notificationMessage: '',
        notificationType: '',
				loading: true,
				images: [],
				tableTitle:'Loading tableTitle',
				title:'Loading title',
        nurl:'',
        imageName:'',
				wasabiIds: [],
				currentPage: 1,
				imagesPerPage: 50,
				totalImages: 0,
				draggedItem: null,
				thumbnails: [],
        bearer:'HThT88wNbJ',
				id:this.$route.query.id,
				loc:this.$route.query.loc
			};
		},
		async created() {
			this.fetchImages();
		},
		computed: {
			paginatedImages() {
				const startIndex = (this.currentPage - 1) * this.imagesPerPage;
				const endIndex = startIndex + this.imagesPerPage;
				return this.images.slice(startIndex, endIndex);
			},
      sortedThumbnails() {
        return this.thumbnails.slice().sort((a, b) => {
          const nameA = a.file.name.toLowerCase();
          const nameB = b.file.name.toLowerCase();
          if (nameA < nameB) return -1;
          if (nameA > nameB) return 1;
          return 0;
        });
      },
		},
		methods: {
			async fetchImages() {
				if (this.id) {
					try {
						const response = await axios.get(`/items/${this.loc}?filter={"rid":${this.id}}&fields=wasabi,rid,title,eventName,nurl,imageName`);
						let res = response.data.data[0]
						if (res.hasOwnProperty('eventName')) {
							res['title'] = res['eventName'];
							delete res['eventName'];
						}
						console.log(res,'res')
						this.title = res.title
						this.nurl = res.nurl
						this.imageName = res.imageName
						this.tableTitle = this.loc?.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());

						console.log(res.wasabi?.length, res.wasabi, 'what if')
						if (res.wasabi?.length !== 0 && res.wasabi?.length !== undefined ) {
							const response2 = await axios.get(`/items/wasabi`, {
								params: {
									filter: {
										id: {
											_in: res.wasabi?.replace(/\[|\]/g, ""),
										},
									},
									fields: 'id,image',
									// limit: this.imagesPerPage,
									// offset: (this.currentPage - 1) * this.imagesPerPage,
								},
							});
							console.log(response2.data.data,'res2')
							this.images = response2.data.data
							// const wasabiIds =  JSON.parse(res.wasabi);

							this.images.sort((a, b) => {
								const indexA = res.wasabi.indexOf(a.id);
								const indexB = res.wasabi.indexOf(b.id);
								return indexA - indexB;
							});

							// this.images = response2.data.data.map((imageObj, index) => ({
							// 	...imageObj,
							// 	id: wasabiIds[index],
							// }));

							this.totalImages = response2.data.data.length;

							// this.images = response2.data.data;
							// this.wasabiIds =response.data.data[0].wasabi;
							// this.totalImages = response2.data.data.length;
						}
					} catch (error) {
						console.error('Error fetching images:', error);
					} finally {
						this.loading = false;
					}
				}
			},
			handlePagination(page) {
				this.currentPage = page;
			},
      async updateWasabiOrder(updatedWasabiIds) {
        console.log(updatedWasabiIds, 'updatedWasabiIds');
        const config = {
          method: 'patch',
          url: `/items/${this.loc}/${this.id}`,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + this.bearer,
          },
          data: {
            wasabi: JSON.stringify(updatedWasabiIds),
          },
        };
        console.log(config, 'config')
        await axios(config)
            .then(function (response) {
              console.log(JSON.stringify(response.data));
            })
            .catch(function (error) {
              console.log(error);
            });
      },
			onDragStart(e) {
				this.draggedItem = e.target.closest('.image-item');
				e.dataTransfer.effectAllowed = 'move';
				e.dataTransfer.setData('text/plain', this.draggedItem.dataset.index);
			},
			onDrop(e) {
				e.preventDefault();
				const target = e.target.closest('.image-item');
				if (target && this.draggedItem !== target) {
					const fromIndex = parseInt(this.draggedItem.dataset.index);
					const toIndex = parseInt(target.dataset.index);
					const draggedImageData = this.images.splice(fromIndex, 1)[0];
					this.images.splice(toIndex, 0, draggedImageData);
					this.onDragEnd({ fromIndex, toIndex });
				}
			},
			onDragEnd({ fromIndex, toIndex }) {
				// Handle logic after dragging ends, e.g., update the order in the database
				console.log(`Moved item from index ${fromIndex} to index ${toIndex}`);
				const updatedWasabiIds = this.images.map((image) => image.id);
				console.log('Updated wasabiIds:', updatedWasabiIds);
        this.updateWasabiOrder(updatedWasabiIds)

			},
			goBack() {
				// Navigate to the previous page or a specific route
				this.$router.go(-1);
			},
			async onImageUpload(e) {
				const files = e.target.files;
				this.thumbnails = [];
				for (const file of files) {
					const thumbnail = await this.createThumbnail(file);
					// Store both the data URL and the original File object
					this.thumbnails.push({ url: thumbnail, file });
				}
			},
			createThumbnail(file) {
				return new Promise((resolve, reject) => {
					const reader = new FileReader();
					reader.onload = (e) => {
						const img = new Image();
						img.src = e.target.result;
						img.onload = () => {
							const canvas = document.createElement('canvas');
							const ctx = canvas.getContext('2d');
							const scaleFactor = 300 / img.width;
							canvas.width = 300;
							canvas.height = img.height * scaleFactor;

							ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
							const thumbnail = canvas.toDataURL();
							resolve(thumbnail);
						};
					};
					reader.onerror = (e) => {
						reject(e);
					};
					reader.readAsDataURL(file);
				});
			},
			async uploadImages() {
				if (this.thumbnails.length === 0) {
					return;
				}
				try {
          this.showNotificationMsg('primary-btn',`Connecting to wasabi server`)
					// Configure the S3 client
					const s3 = new S3Client({
						region: 'us-east-1',
						credentials: {
							accessKeyId : '1WSIWHRURHJVMWHLU1FE',
							secretAccessKey : 'WTpchaqGTymsFA5JG3zKhIJRrS5P0hHThT88wNbJ'
						},
						endpoint: 'https://s3.wasabisys.com',
					});
					let params = await wasabi(this.id,this.loc)
          console.log(params,'params');
          this.progress =0
          let wasabiIds = []

					// Upload images
					const uploads = this.thumbnails.map(async (thumbnail, index) => {
						// Get the original file name without the extension
						const fileExtension = thumbnail.file.name.split('.').pop();
						const fileNameWithoutExtension = thumbnail.file.name.replace(new RegExp(`\.${fileExtension}$`), '');

						// Set the object keys for the original image and the thumbnail
						const originalKey = `${params.Prefix}${fileNameWithoutExtension}.${fileExtension}`;
						const thumbnailKey = `${params.Prefix}${fileNameWithoutExtension}t.${fileExtension}`;

						// Convert the original file to an ArrayBuffer
						const originalArrayBuffer = await new Promise((resolve, reject) => {
							const reader = new FileReader();
							reader.onload = () => resolve(reader.result);
							reader.onerror = (error) => reject(error);
							reader.readAsArrayBuffer(thumbnail.file);
						});

						// Convert the thumbnail data URL to a Blob
						const thumbnailBlob = await (async () => {
							const response = await fetch(thumbnail.url);
							return response.blob();
						})();

						// Convert the thumbnail Blob to an ArrayBuffer
						const thumbnailArrayBuffer = await new Promise((resolve, reject) => {
							const reader = new FileReader();
							reader.onload = () => resolve(reader.result);
							reader.onerror = (error) => reject(error);
							reader.readAsArrayBuffer(thumbnailBlob);
						});

						// Create the parameters for the original image and the thumbnail
						const originalParams = {
							Bucket: params.Bucket,
							Key: originalKey,
							Body: new Uint8Array(originalArrayBuffer),
							ContentType: thumbnail.file.type,
						};

						const thumbnailParams = {
							Bucket: params.Bucket,
							Key: thumbnailKey,
							Body: new Uint8Array(thumbnailArrayBuffer),
							ContentType:thumbnail.file.type,
						};
						console.log(originalParams,'originalParams')
            let total = this.thumbnails.length

						// Upload the original image and the thumbnail
						const putObjectCommands = [
							new PutObjectCommand(originalParams),
							new PutObjectCommand(thumbnailParams),
						];

            for (const command of putObjectCommands) {
              await s3.send(command);
              this.showNotificationMsg('primary-btn',`Uploading: ${index+1}/${total} =>  ${fileNameWithoutExtension}`)
            }

            let imgNo = parseInt(thumbnail.file.name.match(/\d+/g).pop());
            // /movies/functions/123933/csi-sanatan-pre-release-press-meet/image1
            let url=  this.nurl+`/image${imgNo?imgNo:1}`;
            // http://imgcdn.ragalahari.com/mar2023/functions/csi-sanatan-pre-release-meet/csi-sanatan-pre-release-meet1.jpg
            let image =  params.imagePath + thumbnail.file.name


            const response = await axios.get(`/items/wasabi?filter={"url":"${url}"}`);
            let res = response.data.data
            console.log(res);
            if(res.length === 0){

              console.log('inserted',url,image);
              // insert
              await axios({
                method: 'post',
                url: '/items/wasabi',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': 'Bearer '+this.bearer,
                },
                data: {
                  url:url,
                  image: image,
                }
              })
                  .then(async response => {
                    let lastId = await axios.get(`/items/wasabi?limit=1&sort=-id`);
                    lastId = lastId.data.data[0].id
                    wasabiIds.push(lastId)
                    console.log(response.data, lastId, 'resp from insert');
                  })
                  .catch(error => {
                    console.error(error);
                  });

            }else{
              console.log('fetched');
              //fetch
              wasabiIds.push(res[0].id)
            }
						// await Promise.all(putObjectCommands.map((command) => s3.send(command)));
            console.log(index,total,index+1);
            this.progress=((index+1)/total)*100
					});
          await Promise.all(uploads);
          // wasabiIds = [...new Set(wasabiIds)];
          wasabiIds = wasabiIds.filter((id, index) => wasabiIds.indexOf(id) === index);

          console.log(wasabiIds);
          const response = await axios.get(`/items/${this.loc}?filter={"rid":${this.id}}&fields=wasabi`);
          let obj = JSON.parse(response.data.data[0].wasabi)

            // let updatedIds = [...new Set([...obj, ...wasabiIds])];
          let updatedIds = obj.concat(wasabiIds.filter(id => !obj.includes(id)));

          await this.updateWasabiOrder(updatedIds)

          this.showNotificationMsg('success-btn','Images and thumbnails uploaded successfully!')
          // Reset file input element
          const fileInput = document.getElementById('file-input');
          fileInput.value = '';
          this.thumbnails = [];
          this.progress=100
				} catch (error) {
					console.error('Error uploading images:', error);
          //refetch image
          this.showNotificationMsg('danger-btn','Failed to upload images. Please try again.',)

				}
			},
      showNotificationMsg(type, message) {
        this.showNotification = true;
        this.notificationMessage = message;
        this.notificationType = type;
        setTimeout(() => {
          this.hideNotification();
        }, 3000);
      },

      hideNotification() {
        this.showNotification = false;
        this.notificationMessage = '';
        this.notificationType = '';
      },
			removeImage(index) {
				this.thumbnails.splice(index, 1);
			},
		},
	};
</script>


<style>
	.gallery {
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.image-list {
		display: grid;
		grid-template-columns: repeat(5, 1fr);
		gap: 4px;
		width: 100%;
	}
	.image-item {
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.image-item img {
		width: 100%;
		cursor: move;
	}
	/* Add the header bar styles */
	.header-bar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		background-color: #00c897;
		color: white;
		padding: 10px 16px;
	}
	.header-bar h2 {
		margin: 0;
	}
	.header-bar button {
		background-color: transparent;
		border: none;
		color: white;
		cursor: pointer;
		font-size: 16px;
	}
	.header-bar button:hover {
		text-decoration: underline;
	}
	.uploaded-thumbnails {
		display: flex;
		flex-wrap: wrap;
		gap: 4px;
		margin: 8px 0;
	}

	.buttons {
		display: flex;
		justify-content: center;
		gap: 16px;
		margin: 16px 0;
	}

	.select-images-btn,
	.upload-images-btn {
		background-color: #00c897;
		border: none;
		color: white;
		cursor: pointer;
		font-size: 16px;
		padding: 8px 16px;
		transition: background-color 0.2s;
	}

	.select-images-btn:hover,
	.upload-images-btn:hover {
		background-color: #008e68;
	}

	.upload-images-btn:disabled {
		background-color: #8e8e8e;
		cursor: not-allowed;
	}

	.upload-images-btn:disabled:hover {
		background-color: #8e8e8e;
	}

	.thumbnail-container {
		position: relative;
		width: 100px;
		height: auto;
	}

	.thumbnail {
		width: 100%;
		height: auto;
		object-fit: cover;
	}

	.thumbnail-remove {
		position: absolute;
		bottom: 0;
		left: 0;
		width: 100%;
		background-color: rgba(0, 0, 0, 0.6);
		color: white;
		font-size: 12px;
		text-align: center;
		padding: 2px 0;
		cursor: pointer;
		display: none;
	}

	.thumbnail-container:hover .thumbnail-remove {
		display: block;
	}

  .notification {
    position: fixed;
    top: 10px;
    right: 10px;
    padding: 10px;
    border-radius: 4px;
    font-weight: bold;
    z-index:99
  }
  .primary-btn {
    background-color: #000000;
    color: #fff;
  }
  .success-btn {
    background-color: #009f29;
    color: #fff;
  }
  .danger-btn {
    background-color: #d83737;
    color: #fff;
  }
</style>
